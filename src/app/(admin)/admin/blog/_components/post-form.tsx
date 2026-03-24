"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import type { InitialConfigType } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from "@lexical/list";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getRoot,
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  DecoratorNode,
  FORMAT_TEXT_COMMAND,
  createCommand,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { slugify } from "@/utils/slug";
import { AlignCenter, AlignLeft, AlignRight, Bold, ImageIcon, Italic, Link2, List, ListOrdered, Minus, Plus, Settings2, Trash2 } from "lucide-react";

type SerializedImageNode = Spread<
  {
    type: "image";
    version: 1;
    src: string;
    altText: string;
    width: number;
    align: "left" | "center" | "right";
  },
  SerializedLexicalNode
>;

type InsertImagePayload = {
  src: string;
  altText?: string;
};

const INSERT_IMAGE_COMMAND = createCommand<InsertImagePayload>("INSERT_IMAGE_COMMAND");

class ImageNode extends DecoratorNode<React.ReactNode> {
  __src: string;
  __altText: string;
  __width: number;
  __align: "left" | "center" | "right";

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      { src: node.__src, altText: node.__altText, width: node.__width, align: node.__align },
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: serializedNode.src,
      altText: serializedNode.altText,
      width: serializedNode.width,
      align: serializedNode.align,
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: (domNode: Node): DOMConversionOutput | null => {
          if (!(domNode instanceof HTMLImageElement)) return null;

          return {
            node: $createImageNode({
              src: domNode.src,
              altText: domNode.alt || "",
              width: clampWidth(extractWidthFromImageElement(domNode)),
              align: extractAlignFromImageElement(domNode),
            }),
          };
        },
        priority: 1,
      }),
    };
  }

  constructor(
    {
      src,
      altText,
      width,
      align,
    }: { src: string; altText: string; width?: number; align?: "left" | "center" | "right" } = {
      src: "",
      altText: "",
      width: 100,
      align: "center",
    },
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = clampWidth(width ?? 100);
    this.__align = align ?? "center";
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      type: "image",
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      align: this.__align,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    element.setAttribute("data-align", this.__align);
    element.setAttribute("data-width", String(this.__width));
    element.style.width = `${this.__width}%`;
    element.style.height = "auto";
    element.style.display = "block";
    element.style.maxWidth = "100%";
    applyAlignStyles(element, this.__align);
    return { element };
  }

  createDOM(): HTMLElement {
    return document.createElement("span");
  }

  updateDOM(): boolean {
    return false;
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = clampWidth(width);
  }

  setAlign(align: "left" | "center" | "right"): void {
    const writable = this.getWritable();
    writable.__align = align;
  }

  getWidth(): number {
    return this.getLatest().__width;
  }

  getAlign(): "left" | "center" | "right" {
    return this.getLatest().__align;
  }

  decorate(): React.ReactNode {
    return <ImageNodeView nodeKey={this.getKey()} src={this.__src} altText={this.__altText} width={this.__width} align={this.__align} />;
  }
}

function $createImageNode({
  src,
  altText = "",
  width = 100,
  align = "center",
}: {
  src: string;
  altText?: string;
  width?: number;
  align?: "left" | "center" | "right";
}): ImageNode {
  return new ImageNode({ src, altText, width, align });
}

function clampWidth(value: number): number {
  return Math.max(20, Math.min(100, Math.round(value)));
}

function extractWidthFromImageElement(element: HTMLImageElement): number {
  const dataWidth = Number.parseInt(element.dataset.width ?? "", 10);
  if (!Number.isNaN(dataWidth)) return dataWidth;

  const styleWidth = element.style.width;
  if (styleWidth.endsWith("%")) {
    const parsed = Number.parseInt(styleWidth.replace("%", ""), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 100;
}

function extractAlignFromImageElement(element: HTMLImageElement): "left" | "center" | "right" {
  const dataAlign = element.dataset.align;
  if (dataAlign === "left" || dataAlign === "center" || dataAlign === "right") return dataAlign;
  if (element.style.float === "left") return "left";
  if (element.style.float === "right") return "right";
  return "center";
}

function applyAlignStyles(element: HTMLImageElement, align: "left" | "center" | "right") {
  element.style.float = "none";
  if (align === "left") {
    element.style.marginLeft = "0";
    element.style.marginRight = "auto";
    return;
  }
  if (align === "right") {
    element.style.marginLeft = "auto";
    element.style.marginRight = "0";
    return;
  }
  element.style.marginLeft = "auto";
  element.style.marginRight = "auto";
}

function ImageNodeView({
  nodeKey,
  src,
  altText,
  width,
  align,
}: {
  nodeKey: NodeKey;
  src: string;
  altText: string;
  width: number;
  align: "left" | "center" | "right";
}) {
  const [editor] = useLexicalComposerContext();

  const updateNode = (updater: (node: ImageNode) => void) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ImageNode) updater(node);
    });
  };

  const justifyClass =
    align === "left" ? "justify-start" : align === "right" ? "justify-end" : "justify-center";

  return (
    <div className={`group relative my-4 flex ${justifyClass}`}>
      <div className="relative w-full" style={{ maxWidth: `${width}%` }}>
        <img src={src} alt={altText} className="block h-auto w-full rounded-xl" />
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/55 px-2 py-0.5 text-xs text-white">
          {width}%
        </div>
        <div className="absolute left-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => updateNode((node) => node.setAlign("left"))}
            className="rounded-md bg-zinc-900/75 p-1.5 text-white hover:bg-zinc-900"
            aria-label="Aligner a gauche"
            title="Aligner a gauche"
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateNode((node) => node.setAlign("center"))}
            className="rounded-md bg-zinc-900/75 p-1.5 text-white hover:bg-zinc-900"
            aria-label="Aligner au centre"
            title="Aligner au centre"
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateNode((node) => node.setAlign("right"))}
            className="rounded-md bg-zinc-900/75 p-1.5 text-white hover:bg-zinc-900"
            aria-label="Aligner a droite"
            title="Aligner a droite"
          >
            <AlignRight size={14} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => updateNode((node) => node.setWidth(node.getWidth() - 10))}
            className="rounded-md bg-zinc-900/75 p-1.5 text-white hover:bg-zinc-900"
            aria-label="Decrease image size"
            title="Decrease image size"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => updateNode((node) => node.setWidth(node.getWidth() + 10))}
            className="rounded-md bg-zinc-900/75 p-1.5 text-white hover:bg-zinc-900"
            aria-label="Increase image size"
            title="Increase image size"
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => updateNode((node) => node.remove())}
          className="absolute bottom-2 right-2 rounded-md bg-red-600 p-1.5 text-white opacity-0 transition hover:bg-red-700 group-hover:opacity-100"
          aria-label="Delete image"
          title="Delete image"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

const UI_INPUT =
  "w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const theme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "text-zinc-400",
  link: "text-blue-600 underline underline-offset-2 dark:text-blue-400",
  paragraph: "mb-2",
  text: { bold: "font-bold", italic: "italic" },
  list: { ul: "ml-6 list-disc", ol: "ml-6 list-decimal", listItem: "pl-1" },
  heading: { h1: "mb-4 text-3xl font-bold", h2: "mb-3 text-2xl font-semibold" },
};

type PostFormProps = {
  action: (formData: FormData) => Promise<void>;
  initial?: {
    title?: string;
    slug?: string;
    excerpt?: string;
    coverImage?: string;
    content?: string;
    relatedProducts?: string[];
    published?: boolean;
  };
  submitLabel: string;
};

export default function PostForm({ action, initial, submitLabel }: PostFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [coverImagePreview, setCoverImagePreview] = useState(initial?.coverImage ?? "");
  const [editorContent, setEditorContent] = useState(initial?.content ?? "");
  const generatedSlug = useMemo(() => slugify(title), [title]);

  const initialConfig = useMemo<InitialConfigType>(
    () => ({
      namespace: "Editor",
      theme,
      nodes: [HeadingNode, ListNode, ListItemNode, QuoteNode, ImageNode, LinkNode, AutoLinkNode],
      onError: (err: Error) => console.error(err),
    }),
    []
  );

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("content", editorContent);
    formData.set("title", title);
    formData.set("slug", generatedSlug);
    formData.set("excerpt", excerpt);
    await action(formData);
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <form
        onSubmit={handleFormSubmit}
        className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 md:px-6"
      >
        <UnifiedTopNav submitLabel={submitLabel} />

        <div className="mx-auto w-full max-w-[1200px] space-y-6 pb-8">
          <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">Post details</h2>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Fill in the metadata before publishing.</p>
              </div>
             
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={UI_INPUT}
                  placeholder="Post title"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Slug</label>
                <input value={generatedSlug} readOnly className={`${UI_INPUT} cursor-not-allowed bg-slate-50`} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Status</label>
                <label className="flex h-[42px] cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-white px-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                  <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">Published</span>
                  <input
                    type="checkbox"
                    name="published"
                    defaultChecked={initial?.published ?? true}
                    className="accent-blue-600"
                  />
                </label>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className={`${UI_INPUT} min-h-[96px] resize-y`}
                  placeholder="Short excerpt"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-zinc-500">Cover image (file)</label>
                <input
                  name="coverImage"
                  type="file"
                  accept="image/*"
                  className={`${UI_INPUT} file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") setCoverImagePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {coverImagePreview ? (
                  <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <div className="aspect-video w-full">
                      <img src={coverImagePreview} alt="Cover preview" className="h-full w-full object-cover" />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/40 dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-zinc-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">Post content</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-400">Write with the styles available in the toolbar.</p>
              </div>
            </div>
            <div className="relative">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="min-h-[640px] p-8 text-lg leading-relaxed text-slate-800 outline-none dark:text-zinc-100 md:p-10" />
                }
                placeholder={
                  <div className="pointer-events-none absolute left-8 top-8 text-lg text-zinc-300">Start writing your post...</div>
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <ListPlugin />
              <LinkPlugin />
              <InitialContentPlugin initialHtml={initial?.content ?? ""} />
              <ImageCommandPlugin />
              <OnChangePlugin onChange={setEditorContent} />
            </div>
          </section>
        </div>
      </form>
    </LexicalComposer>
  );
}

function UnifiedTopNav({ submitLabel }: { submitLabel: string }) {
  const [editor] = useLexicalComposerContext();
  const contentImageInputRef = useRef<HTMLInputElement | null>(null);
  const [activeBlock, setActiveBlock] = useState<"h1" | "h2" | "p" | null>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const insertImage = () => {
    contentImageInputRef.current?.click();
  };

  const setBlock = (tag: "h1" | "h2" | "p") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (tag === "p") {
          selection.insertNodes([$createParagraphNode()]);
          return;
        }
        selection.insertNodes([$createHeadingNode(tag)]);
      }
    });
  };

  const toggleLink = () => {
    const url = window.prompt("Enter URL (leave blank to remove):", "https://");
    if (url === null) return;
    const normalized = url.trim();
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized ? normalized : null);
  };

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      let nextBlock: "h1" | "h2" | "p" | null = null;
      let nextBold = false;
      let nextItalic = false;
      let nextLink = false;

      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        nextBold = selection.hasFormat("bold");
        nextItalic = selection.hasFormat("italic");

        const anchorNode = selection.anchor.getNode();
        const parent = anchorNode.getParent();
        if ($isLinkNode(anchorNode) || (parent != null && $isLinkNode(parent))) {
          nextLink = true;
        }
        const topLevel = anchorNode.getTopLevelElementOrThrow();
        if ($isHeadingNode(topLevel)) {
          const headingTag = topLevel.getTag();
          if (headingTag === "h1" || headingTag === "h2") {
            nextBlock = headingTag;
            return;
          }
        }

        if (topLevel.getType() === "paragraph") {
          nextBlock = "p";
        }
      });

      setActiveBlock(nextBlock);
      setIsBold(nextBold);
      setIsItalic(nextItalic);
      setIsLink(nextLink);
    });
  }, [editor]);

  const blockBtnClass = (isActive: boolean) =>
    `rounded-xl border px-3 py-2 text-sm font-bold transition ${
      isActive
        ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-400/50 dark:bg-blue-500/25 dark:text-blue-200"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/15"
    }`;

  const formatBtnClass = (isActive: boolean) =>
    `rounded-xl border p-2 transition ${
      isActive
        ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-400/50 dark:bg-blue-500/25 dark:text-blue-200"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/15"
    }`;

  return (
    <header className="sticky top-4 z-40 mb-6 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2 rounded-xl bg-blue-50 px-2.5 py-1.5 dark:bg-blue-500/15">
          <Settings2 className="h-4 w-4 text-blue-600" />
        </div>
        <div className="mx-1 h-4 w-px bg-slate-300 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={() => setBlock("h1")}
          className={blockBtnClass(activeBlock === "h1")}
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => setBlock("h2")}
          className={blockBtnClass(activeBlock === "h2")}
        >
          Subheading
        </button>
        <button
          type="button"
          onClick={() => setBlock("p")}
          className={blockBtnClass(activeBlock === "p")}
        >
          Paragraph
        </button>
        <div className="mx-1 h-4 w-px bg-slate-300 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          className={formatBtnClass(isBold)}
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          className={formatBtnClass(isItalic)}
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={toggleLink}
          className={formatBtnClass(isLink)}
        >
          <Link2 size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/15"
        >
          <List size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/15"
        >
          <ListOrdered size={18} />
        </button>
        <div className="mx-1 h-4 w-px bg-slate-300 dark:bg-zinc-700" />
        <button
          type="button"
          onClick={insertImage}
          className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
        >
          <ImageIcon size={18} />
        </button>
        <input
          ref={contentImageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result !== "string") return;
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                src: reader.result,
                altText: file.name || "Blog image",
              });
            };
            reader.readAsDataURL(file);
            e.currentTarget.value = "";
          }}
        />
        <div className="ml-auto">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </header>
  );
}

function OnChangePlugin({ onChange }: { onChange: (val: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        onChange($generateHtmlFromNodes(editor, null));
      });
    });
  }, [editor, onChange]);

  return null;
}

function InitialContentPlugin({ initialHtml }: { initialHtml: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialHtml) return;

    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      root.append(...nodes);
    });
  }, [editor, initialHtml]);

  return null;
}

function ImageCommandPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<InsertImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          selection.insertNodes([imageNode]);
        } else {
          $insertNodes([imageNode]);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
