const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const version = '0.31.0';
const artifacts = {
  win32: ['windows_amd64', 'a63af6376534d8af8565e559cb8899f2d6dfaae35d8ca48410231a04f8f05220'],
  linux: ['linux_amd64', 'd3474eb8c492bbf5bee78395847f9549ab9331f5c581859da9d8b890c8d7769b'],
};
(async () => {
  if (process.arch !== 'x64' || !artifacts[process.platform]) throw new Error('Use PB_TEST_BINARY for this platform.');
  const [platform, checksum] = artifacts[process.platform];
  const target = path.resolve(__dirname, '../.local-tools/pocketbase');
  fs.mkdirSync(target, { recursive: true });
  const response = await fetch(`https://github.com/pocketbase/pocketbase/releases/download/v${version}/pocketbase_${version}_${platform}.zip`);
  if (!response.ok) throw new Error('PocketBase download failed.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (crypto.createHash('sha256').update(bytes).digest('hex') !== checksum) throw new Error('PocketBase checksum mismatch.');
  const archive = path.join(target, 'download.zip'); fs.writeFileSync(archive, bytes);
  if (process.platform === 'win32') {
    const quote = value => "'" + value.replace(/'/g, "''") + "'";
    execFileSync('powershell.exe', ['-NoProfile', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [IO.Compression.ZipFile]::OpenRead(${quote(archive)}); try { $entry = $zip.GetEntry('pocketbase.exe'); [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, ${quote(path.join(target, 'pocketbase.exe'))}, $true) } finally { $zip.Dispose() }`], { windowsHide: true });
  } else execFileSync('unzip', ['-o', archive, '-d', target]);
  fs.unlinkSync(archive);
  const binary = path.join(target, process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
  if (process.platform !== 'win32') fs.chmodSync(binary, 0o755);
  console.log(execFileSync(binary, ['--version'], { encoding: 'utf8' }).trim());
})().catch(error => { console.error(error.message); process.exitCode = 1; });
