import 'server-only'

import { getPb } from '@/lib/pb';

export const fetchTodaySales = async (): Promise<number> => {
  const pb = getPb();
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pad = (n: number) => n.toString().padStart(2, '0');
  const pbDate = `${startOfDay.getFullYear()}-${pad(startOfDay.getMonth() + 1)}-${pad(startOfDay.getDate())} 00:00:00`;

  const records = await pb.collection('orders').getFullList({
    filter: `(status = "paid" || status = "delivering" || status = "delivered") && created >= "${pbDate}"`,
    fields: 'total',
    requestKey: null,
  });

  return records.reduce((sum, order) => sum + (order.total || 0), 0);
};

export const fetchAlertCounts = async () => {
  const pb = getPb();
  
  try {
    const [outOfStock, lowStock, pendingOrders] = await Promise.all([
      pb.collection('products').getList(1, 1, { filter: 'stock = 0', requestKey: null }),
      pb.collection('products').getList(1, 1, { filter: 'stock > 0 && stock < 10', requestKey: null }),
      pb.collection('orders').getList(1, 50, { // Increased limit to see the data
        filter: 'status = "paid"',
        requestKey: null 
      })
    ]);

    return {
      outOfStock: outOfStock.totalItems,
      lowStock: lowStock.totalItems,
      pendingOrders: pendingOrders.totalItems
    };
  } catch (error) {
    return { outOfStock: 0, lowStock: 0, pendingOrders: 0 };
  }
};


export const fetchChartRowData = async () => {
  const pb = getPb();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

  const pbDateLimit = fourteenDaysAgo.toISOString().replace('T', ' ').split('.')[0];

  const [deliveredOrders, totalCount] = await Promise.all([
    pb.collection('orders').getFullList({
      filter: `(status = "paid" || status = "delivering" || status = "delivered") && created >= "${pbDateLimit}"`,
      fields: 'total,created',
    }),
    pb.collection('orders').getList(1, 1),
  ]);

  let currentWeekTotal = 0;
  let previousWeekTotal = 0;
  const salesByDay = new Array(7).fill(0);

  deliveredOrders.forEach(order => {
    const orderDate = new Date(order.created);
    orderDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < 7) {
      currentWeekTotal += (order.total || 0);
      salesByDay[6 - diffDays] += (order.total || 0);
    } else if (diffDays >= 7 && diffDays < 14) {
      previousWeekTotal += (order.total || 0);
    }
  });

  let growth = 0;
  if (previousWeekTotal > 0) growth = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
  else if (currentWeekTotal > 0) growth = 100;

  return {
    weeklySalesTotal: currentWeekTotal,
    weeklySalesData: salesByDay,
    totalOrders: totalCount.totalItems,
    salesGrowth: parseFloat(growth.toFixed(1)),
  };
};
export const fetchExtendedStats = async () => {
  const pb = getPb();
  const now = new Date();
  
  // Début du mois actuel
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Début du mois précédent
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Nombre de jours écoulés dans le mois actuel (minimum 1 pour éviter division par zéro)
  const daysPassedCurrent = Math.max(now.getDate(), 1);
  
  // Nombre total de jours dans le mois précédent
  const daysInPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

  const pbDateLimit = startOfPreviousMonth.toISOString().replace('T', ' ').split('.')[0];

  const allOrders = await pb.collection('orders').getFullList({
    filter: `updated >= "${pbDateLimit}"`,
    fields: 'total,status,updated',
  });

  const stats = {
    current: { total: 0, delCount: 0, retCount: 0, delSales: 0, retSales: 0 },
    previous: { total: 0, delCount: 0, retCount: 0, delSales: 0, retSales: 0 }
  };

  allOrders.forEach(order => {
    const orderDate = new Date(order.updated);
    const amount = order.total || 0;
    
    // On ignore les commandes futures si elles existent par erreur
    if (orderDate > now) return;

    const isCurrentMonth = orderDate >= startOfCurrentMonth;
    const target = isCurrentMonth ? stats.current : stats.previous;
    
    target.total++;
    if (order.status === 'delivered') {
      target.delCount++;
    }

    if (order.status === 'paid' || order.status === 'delivering' || order.status === 'delivered') {
      target.delSales += amount;
    } else if (order.status === 'refunded') {
      target.retCount++;
      target.retSales += amount;
    }
  });

  // LOGIQUE DE CROISSANCE PROJETÉE (Basée sur la moyenne journalière)
  const calculateProjectedGrowth = (currTotal: number, prevTotal: number) => {
    const currentAvg = currTotal / daysPassedCurrent;
    const previousAvg = prevTotal / daysInPreviousMonth;

    if (previousAvg === 0) return currentAvg > 0 ? 100 : 0;
    
    const growth = ((currentAvg - previousAvg) / previousAvg) * 100;
    return parseFloat(growth.toFixed(1));
  };

  return {
    totalOrders: { 
      value: stats.current.total, 
      growth: calculateProjectedGrowth(stats.current.total, stats.previous.total) 
    },
    delivered: { 
      count: stats.current.delCount, 
      countGrowth: calculateProjectedGrowth(stats.current.delCount, stats.previous.delCount),
      sales: stats.current.delSales,
      salesGrowth: calculateProjectedGrowth(stats.current.delSales, stats.previous.delSales)
    },
    returned: { 
      count: stats.current.retCount, 
      countGrowth: calculateProjectedGrowth(stats.current.retCount, stats.previous.retCount),
      sales: stats.current.retSales,
      salesGrowth: calculateProjectedGrowth(stats.current.retSales, stats.previous.retSales)
    }
  };
};

export const fetchMonthlyOrdersTrend = async (viewMode: 'month' | 'year', month: number, year: number) => {
  const pb = getPb();
  
  // Set date boundaries based on view mode
  const startDate = viewMode === 'month' 
    ? new Date(year, month, 1) 
    : new Date(year, 0, 1);
  
  const endDate = viewMode === 'month' 
    ? new Date(year, month + 1, 0) 
    : new Date(year, 11, 31, 23, 59, 59);

  const pbStartDate = startDate.toISOString().replace('T', ' ').split('.')[0];
  const pbEndDate = endDate.toISOString().replace('T', ' ').split('.')[0];

  try {
    const orders = await pb.collection('orders').getFullList({
      filter: `created >= "${pbStartDate}" && created <= "${pbEndDate}" && (status = "delivered" || status = "refunded")`,
      fields: 'status,created',
      sort: 'updated'
    });

    const monthNamesFr = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    
    let deliveredData: number[];
    let returnedData: number[];
    let labels: string[];

    if (viewMode === 'month') {
      const daysInMonth = endDate.getDate();
      deliveredData = new Array(daysInMonth).fill(0);
      returnedData = new Array(daysInMonth).fill(0);
      labels = Array.from({ length: daysInMonth }, (_, i) => `${monthNamesFr[month]} ${i + 1}`);

      orders.forEach(order => {
        const dayIndex = new Date(order.created).getDate() - 1;
        if (order.status === 'delivered') deliveredData[dayIndex]++;
        else if (order.status === 'refunded') returnedData[dayIndex]++;
      });
    } else {
      // Annual view: Group by month
      deliveredData = new Array(12).fill(0);
      returnedData = new Array(12).fill(0);
      labels = monthNamesFr;

      orders.forEach(order => {
        const monthIndex = new Date(order.created).getMonth();
        if (order.status === 'delivered') deliveredData[monthIndex]++;
        else if (order.status === 'refunded') returnedData[monthIndex]++;
      });
    }

    return {
      delivered: deliveredData,
      returned: returnedData,
      labels,
      deliveredTotal: deliveredData.reduce((a, b) => a + b, 0),
      returnedTotal: returnedData.reduce((a, b) => a + b, 0),
    };
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};


export const fetchMonthlySalesTrend = async (viewMode: 'month' | 'year', month: number, year: number) => {
  const pb = getPb();
  
  const startDate = viewMode === 'month' 
    ? new Date(year, month, 1) 
    : new Date(year, 0, 1);
  
  const endDate = viewMode === 'month' 
    ? new Date(year, month + 1, 0) 
    : new Date(year, 11, 31, 23, 59, 59);

  const pbStartDate = startDate.toISOString().replace('T', ' ').split('.')[0];
  const pbEndDate = endDate.toISOString().replace('T', ' ').split('.')[0];

  try {
    const orders = await pb.collection('orders').getFullList({
      filter: `created >= "${pbStartDate}" && created <= "${pbEndDate}" && (status = "paid" || status = "delivering" || status = "delivered")`,
      fields: 'total,created',
      sort: 'updated'
    });

    const monthNamesFr = ['Janv', 'Févr', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    let salesData: number[];
    let labels: string[];

    if (viewMode === 'month') {
      const daysInMonth = endDate.getDate();
      salesData = new Array(daysInMonth).fill(0);
      labels = Array.from({ length: daysInMonth }, (_, i) => `${monthNamesFr[month]} ${i + 1}`);

      orders.forEach(order => {
        const dayIndex = new Date(order.created).getDate() - 1;
        salesData[dayIndex] += (order.total || 0);
      });
    } else {
      salesData = new Array(12).fill(0);
      labels = monthNamesFr;

      orders.forEach(order => {
        const monthIndex = new Date(order.created).getMonth();
        salesData[monthIndex] += (order.total || 0);
      });
    }

    return {
      sales: salesData,
      labels,
      totalRevenue: salesData.reduce((a, b) => a + b, 0),
    };
  } catch (error) {
    console.error('Erreur fetchMonthlySalesTrend:', error);
    throw error;
  }
};

export const fetchRecentPurchases = async () => {
  const pb = getPb();
  try {
    const records = await pb.collection('orders').getList(1, 7, {
      sort: '-created',
      expand: 'user',
      fields: 'id,total,status,items,phone,firstName,lastName',
    });

    return records.items.map((r: any) => {
      const fullName = (r.firstName || r.lastName) 
        ? `${r.firstName} ${r.lastName}`.trim() 
        : ([r.expand?.user?.surname, r.expand?.user?.name].filter(Boolean).join(' ').trim() || 'Client Invité');

      // --- New Product Name Logic ---
      const items = r.items || [];
      const count = items.length;
      let productDisplay = 'Sans nom';

      if (count === 1) {
        if (items[0].quantity === 1) {
            productDisplay = items[0].name || 'Produit sans nom';

        }
        else{
              const firstItemName = items[0].name || 'Produit';
        productDisplay = `${items[0].quantity} x ${firstItemName}`;
        }
        
      } else if (count > 1) {
        // Format: "3x Nom du premier produit (+2)"
        const firstItemName = items[0].name || 'Produit';
        productDisplay = `${items[0].quantity} x ${firstItemName} + ${count - 1}`;
      }

      return {
        id: r.id,
        customer: fullName,
        phone: r.phone || '—',
        product: productDisplay,
        status: r.status as any,
        amount: r.total || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching recent purchases:', error);
    return [];
  }
};

export const fetchBestSellingProducts = async () => {
  const pb = getPb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const pbDate = sevenDaysAgo.toISOString().replace('T', ' ').split('.')[0];

  try {
    const orders = await pb.collection('orders').getFullList({
      filter: `(status = "paid" || status = "delivering" || status = "delivered") && created >= "${pbDate}"`,
      fields: 'items',
      requestKey: null,
    });

    const productStats: Record<string, { 
      name: string, 
      sku: string, 
      orders: number, 
      revenue: number 
    }> = {};

    orders.forEach(order => {
      const items = order.items || [];
      items.forEach((item: any) => {
        const id = item.productId || item.id;
        if (!id) return;

        if (!productStats[id]) {
          productStats[id] = {
            name: item.name?.trim() || 'Produit inconnu',
            sku: item.sku || '',
            orders: 0,
            revenue: 0,
          };
        }

        const qty = Number(item.quantity) || 0;
        const price = Number(item.unitPrice) || 0;
        productStats[id].orders += qty;
        productStats[id].revenue += (price * qty);
      });
    });

    // Sort by REVENUE descending
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 7);

    // Fetch actual images from the 'products' collection
    const finalProducts = await Promise.all(
      topProducts.map(async (stat) => {
        try {
          // Find the product by SKU to get its image array
          const productRecord = await pb.collection('products').getFirstListItem(`sku="${stat.sku}"`, {
            fields: 'id,collectionId,images',
            requestKey: null,
          });

          let imageUrl = '';
          if (productRecord && productRecord.images?.length > 0) {
            // Build the URL correctly using the PocketBase helper
            imageUrl = pb.files.getURL(productRecord, productRecord.images[0], { thumb: '100x100' });
          }

          return {
            ...stat,
            image: imageUrl || '📦' 
          };
        } catch (e) {
          return { ...stat, image: '📦' };
        }
      })
    );

    return finalProducts;
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return [];
  }
};

