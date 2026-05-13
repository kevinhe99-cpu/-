import { useState } from "react";
import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  Plus,
  Package,
  Pill,
  Apple,
  Leaf,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Clock,
  Trash2,
  Search,
  Filter,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  categoryLabels,
  categoryBgColors,
  statusLabels,
  statusColors,
  statusDotColors,
  type ProductCategory,
  type ExpiryStatus,
} from "@/types";
import { getDaysUntilExpiry, getDaysText } from "@/lib/utils";

type FilterTab = "all" | ProductCategory;
type StatusFilter = "all" | ExpiryStatus;

export default function Home() {
  const [categoryTab, setCategoryTab] = useState<FilterTab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.list.useQuery(
    categoryTab === "all" && statusFilter === "all"
      ? undefined
      : {
          ...(categoryTab !== "all" ? { category: categoryTab } : {}),
          ...(statusFilter !== "all" ? { status: statusFilter } : {}),
        }
  );
  const { data: stats } = trpc.products.stats.useQuery();
  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.stats.invalidate();
      setDeleteId(null);
    },
  });

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <CalendarClock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                到期提醒管家
              </h1>
              <p className="text-xs text-gray-500">食品 · 药品 · 补品</p>
            </div>
          </div>
          <Link to="/add">
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 rounded-xl h-9 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              添加产品
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            <Card className="border-amber-100 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-medium">总产品</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-gradient-to-br from-red-50 to-rose-50 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600/70 text-xs font-medium">
                      已过期
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                      {stats.expired}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600/70 text-xs font-medium">
                      即将到期
                    </p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {stats.expiringSoon}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600/70 text-xs font-medium">
                      正常
                    </p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                      {stats.normal}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Distribution */}
        {stats && stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Apple className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700/70">食品</p>
                <p className="text-lg font-bold text-amber-800">
                  {stats.food}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-2xl p-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                <Pill className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-sky-700/70">药品</p>
                <p className="text-lg font-bold text-sky-800">
                  {stats.medicine}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-700/70">补品</p>
                <p className="text-lg font-bold text-emerald-800">
                  {stats.supplement}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3 animate-slide-up">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索产品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-gray-200 bg-white focus-visible:ring-amber-400"
            />
          </div>

          {/* Category Tabs */}
          <Tabs
            value={categoryTab}
            onValueChange={(v) => setCategoryTab(v as FilterTab)}
          >
            <TabsList className="w-full h-11 bg-gray-100/80 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium"
              >
                全部
              </TabsTrigger>
              <TabsTrigger
                value="food"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium"
              >
                食品
              </TabsTrigger>
              <TabsTrigger
                value="medicine"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium"
              >
                药品
              </TabsTrigger>
              <TabsTrigger
                value="supplement"
                className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-medium"
              >
                补品
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {(["all", "expired", "expiring_soon", "normal"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === s
                      ? s === "all"
                        ? "bg-gray-800 text-white"
                        : s === "expired"
                        ? "bg-red-500 text-white"
                        : s === "expiring_soon"
                        ? "bg-orange-500 text-white"
                        : "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "all" ? "全部状态" : statusLabels[s]}
                </button>
              )
            )}
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3 animate-slide-up">
          {isLoading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-400 mt-3">加载中...</p>
            </div>
          ) : filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const days = getDaysUntilExpiry(product.expiryDate);
              const isExpired = days < 0;
              const isExpiringSoon = days >= 0 && days <= 30;

              return (
                <Card
                  key={product.id}
                  className={`group border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    isExpired
                      ? "border-red-100 hover:border-red-200 bg-red-50/30"
                      : isExpiringSoon
                      ? "border-orange-100 hover:border-orange-200 bg-orange-50/30"
                      : "border-gray-100 hover:border-gray-200 bg-white"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3.5">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {product.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 h-5 rounded-md font-medium ${categoryBgColors[product.category]}`}
                          >
                            {categoryLabels[product.category]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 h-5 rounded-md font-medium ${statusColors[product.status]}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1 ${statusDotColors[product.status]}`}
                            />
                            {statusLabels[product.status]}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            到期日期: {new Date(product.expiryDate).toLocaleDateString("zh-CN")}
                          </span>
                        </div>

                        <p
                          className={`text-xs font-medium ${
                            isExpired
                              ? "text-red-600"
                              : isExpiringSoon
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {getDaysText(days)}
                        </p>

                        {product.notes && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {product.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                {searchQuery ? "没有找到匹配的产品" : "还没有添加任何产品"}
              </p>
              <p className="text-gray-400 text-sm mb-4">
                {searchQuery
                  ? "试试其他关键词"
                  : "添加你的第一个产品，开始管理到期时间"}
              </p>
              {!searchQuery && (
                <Link to="/add">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/25">
                    <Plus className="w-4 h-4 mr-1.5" />
                    添加产品
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="rounded-2xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">确认删除</DialogTitle>
            <DialogDescription className="text-gray-500">
              删除后将无法恢复，确定要删除这个产品吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="rounded-xl"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中..." : "删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
