"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";
import Head from "next/head";

interface Product {
  id: number;
  title: string;
  vendor: string;
  product_type: string;
  status: string;
  updated_at: string;
  variants: Array<{ 
    price: string; 
    inventory_quantity: number;
    sku?: string;
  }>;
  images: Array<{ src: string }>;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const updated = new Date(dateString);
  const diffMs = now.getTime() - updated.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function SupplierDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "draft" | "under500" | "500to1000">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const itemsPerPage = 150;

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products?vendor=Wellbeing");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(productId: number, currentStatus: string) {
    setUpdating(productId);
    const newStatus = currentStatus === "active" ? "draft" : "active";

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === productId ? data.product : p
          )
        );
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product status");
    } finally {
      setUpdating(null);
    }
  }

  async function bulkUpdateStatus(status: "active" | "draft") {
    if (selectedIds.size === 0) return;
    
    setBulkUpdating(true);
    const ids = Array.from(selectedIds);
    
    for (const id of ids) {
      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        
        const data = await res.json();
        if (data.success) {
          setProducts(prevProducts => 
            prevProducts.map(p => p.id === id ? data.product : p)
          );
        }
      } catch (error) {
        console.error(`Failed to update product ${id}:`, error);
      }
    }
    
    setSelectedIds(new Set());
    setBulkUpdating(false);
  }

  const filteredProducts = products.filter(p => {
    const price = parseFloat(p.variants?.[0]?.price || "0");
    
    let matchesFilter = true;
    if (filter === "active") {
      matchesFilter = p.status === "active";
    } else if (filter === "draft") {
      matchesFilter = p.status === "draft";
    } else if (filter === "under500") {
      matchesFilter = price < 500;
    } else if (filter === "500to1000") {
      matchesFilter = price >= 500 && price <= 1000;
    }
    
    const sku = p.variants?.[0]?.sku || "";
    const matchesSearch = searchQuery === "" || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const activeCount = products.filter(p => p.status === "active").length;
  const draftCount = products.filter(p => p.status === "draft").length;
  const under500Count = products.filter(p => parseFloat(p.variants?.[0]?.price || "0") < 500).length;
  const range500to1000Count = products.filter(p => {
    const price = parseFloat(p.variants?.[0]?.price || "0");
    return price >= 500 && price <= 1000;
  }).length;

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchQuery, filter]);

  function toggleSelectAll() {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map(p => p.id)));
    }
  }

  function toggleSelect(id: number) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  return (
    <>
      <Head>
        <title>Supplier Portal - Noons Baby</title>
        <meta name="description" content="Manage your product availability for Noons Baby store" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <img 
              src="https://noonsbaby.com/cdn/shop/files/Logo_11.png" 
              alt="Noons Baby Logo" 
              className="h-12"
            />
            <h1 className="text-2xl font-bold text-gray-800">Supplier Portal</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8 space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader 
              className="pb-3 cursor-pointer hover:bg-blue-100 transition-colors rounded-t-lg"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📢</span>
                  <CardTitle className="text-lg">গুরুত্বপূর্ণ নির্দেশনা - Important Instructions</CardTitle>
                </div>
                {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
            {showInstructions && (
              <CardContent className="space-y-3 text-sm">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">🎯 প্রথমে এই প্রোডাক্টগুলো আপডেট করুন:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                    <li><strong>৳৫০০ এর নিচে</strong> - এই প্রোডাক্টগুলো আমাদের বিজ্ঞাপনে চলছে (সবচেয়ে গুরুত্বপূর্ণ)</li>
                    <li><strong>৳৫০০-১০০০</strong> - এগুলোও বিজ্ঞাপনে আছে (গুরুত্বপূর্ণ)</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="font-semibold text-green-900 mb-2">✅ কিভাবে আপডেট করবেন:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-gray-700">
                    <li><strong>Active</strong> = স্টক আছে (গ্রাহক কিনতে পারবে)</li>
                    <li><strong>Draft</strong> = স্টক নেই (গ্রাহক দেখবে না)</li>
                    <li>একসাথে অনেক প্রোডাক্ট আপডেট করতে চেকবক্স দিয়ে সিলেক্ট করুন</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Under ৳500</p>
                    <p className="text-2xl font-bold text-blue-600">{under500Count}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">৳500 - ৳1000</p>
                    <p className="text-2xl font-bold text-indigo-600">{range500to1000Count}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Active</p>
                    <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border shadow-sm">
                    <p className="text-xs text-gray-600 mb-1">Draft</p>
                    <p className="text-2xl font-bold text-orange-600">{draftCount}</p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Search, filter, and manage product availability</CardDescription>
              
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by SKU or title..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={filter === "all" ? "default" : "outline"}
                      onClick={() => setFilter("all")}
                      size="sm"
                    >
                      All ({products.length})
                    </Button>
                    <Button 
                      variant={filter === "under500" ? "default" : "outline"}
                      onClick={() => setFilter("under500")}
                      size="sm"
                    >
                      🎯 Under ৳500 ({under500Count})
                    </Button>
                    <Button 
                      variant={filter === "500to1000" ? "default" : "outline"}
                      onClick={() => setFilter("500to1000")}
                      size="sm"
                    >
                      ⭐ ৳500-1000 ({range500to1000Count})
                    </Button>
                    <Button 
                      variant={filter === "active" ? "default" : "outline"}
                      onClick={() => setFilter("active")}
                      size="sm"
                    >
                      Active ({activeCount})
                    </Button>
                    <Button 
                      variant={filter === "draft" ? "default" : "outline"}
                      onClick={() => setFilter("draft")}
                      size="sm"
                    >
                      Draft ({draftCount})
                    </Button>
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex gap-2 ml-auto items-center">
                      <span className="text-sm text-gray-600">{selectedIds.size} selected</span>
                      <Button 
                        size="sm" 
                        onClick={() => bulkUpdateStatus("active")}
                        disabled={bulkUpdating}
                      >
                        Set Active
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => bulkUpdateStatus("draft")}
                        disabled={bulkUpdating}
                      >
                        Set Draft
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8">Loading products...</p>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-3">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                        <TableRow>
                          <TableHead className="w-12">
                            <button onClick={toggleSelectAll}>
                              {selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? 
                                <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />
                              }
                            </button>
                          </TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Updated</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedProducts.map((product) => {
                          const isActive = product.status === "active";
                          const rowClass = isActive ? "bg-green-50 hover:bg-green-100" : "bg-orange-50 hover:bg-orange-100";
                          const timeAgo = getTimeAgo(product.updated_at);
                          
                          return (
                            <TableRow 
                              key={product.id} 
                              className={`${selectedIds.has(product.id) ? "bg-blue-100" : rowClass} transition-colors`}
                            >
                              <TableCell>
                                <button onClick={() => toggleSelect(product.id)}>
                                  {selectedIds.has(product.id) ? 
                                    <CheckSquare className="w-5 h-5 text-blue-600" /> : 
                                    <Square className="w-5 h-5" />
                                  }
                                </button>
                              </TableCell>
                              <TableCell>
                                <img 
                                  src={product.images[0]?.src || "/placeholder.png"} 
                                  alt={product.title}
                                  className="w-20 h-20 object-cover rounded border"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {product.variants?.[0]?.sku || "N/A"}
                              </TableCell>
                              <TableCell className="font-medium max-w-xs">
                                <div className="line-clamp-2">{product.title}</div>
                              </TableCell>
                              <TableCell className="font-semibold">৳{product.variants?.[0]?.price || "0"}</TableCell>
                              <TableCell>
                                <Badge variant={isActive ? "default" : "secondary"} className="font-medium">
                                  {product.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-600 whitespace-nowrap">
                                {timeAgo}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant={isActive ? "destructive" : "default"}
                                  onClick={() => toggleStatus(product.id, product.status)}
                                  disabled={updating === product.id}
                                >
                                  {updating === product.id ? "..." : 
                                   isActive ? "Set Draft" : "Set Active"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}