import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import {
  ArrowLeft,
  Camera,
  Upload,
  X,
  Sparkles,
  Loader2,
  Apple,
  Pill,
  Leaf,
  Calendar,
  FileText,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { categoryLabels, type ProductCategory } from "@/types";

const categoryIcons = {
  food: Apple,
  medicine: Pill,
  supplement: Leaf,
};

const categoryOptions: ProductCategory[] = ["food", "medicine", "supplement"];

interface AIData {
  name: string | null;
  category: string | null;
  expiryDate: string | null;
  confidence: string;
}

export default function AddProduct() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<"upload" | "preview" | "form">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<AIData | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "food" as ProductCategory,
    expiryDate: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.stats.invalidate();
      navigate("/");
    },
  });

  const analyzeMutation = trpc.ai.analyzeLabel.useMutation();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setStep("preview");
        analyzeImage(result);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({ imageUrl: imageData });
      setAiData(result);

      // Auto-fill form with AI results
      if (result.name) {
        setFormData((prev) => ({ ...prev, name: result.name! }));
      }
      if (
        result.category &&
        ["food", "medicine", "supplement"].includes(result.category)
      ) {
        setFormData((prev) => ({
          ...prev,
          category: result.category as ProductCategory,
        }));
      }
      if (result.expiryDate) {
        setFormData((prev) => ({ ...prev, expiryDate: result.expiryDate! }));
      }
    } finally {
      setIsAnalyzing(false);
      setStep("form");
    }
  };

  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("无法访问摄像头，请检查权限设置");
      setIsCameraOpen(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setImagePreview(dataUrl);
      setIsCameraOpen(false);
      setStep("preview");

      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());

      analyzeImage(dataUrl);
    }
  };

  const closeCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
    }
    setIsCameraOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expiryDate) return;

    createMutation.mutate({
      name: formData.name,
      category: formData.category,
      expiryDate: formData.expiryDate,
      imageUrl: imagePreview || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-base font-bold text-gray-900">
            {step === "upload"
              ? "添加产品"
              : step === "preview"
              ? "识别中..."
              : "确认信息"}
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Upload Step */}
        {step === "upload" && !isCameraOpen && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-500/25">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                拍摄或上传标签
              </h2>
              <p className="text-sm text-gray-500">
                AI 将自动识别产品名称和到期日期
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={openCamera}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 hover:border-amber-400 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  拍照
                </span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-lg shadow-gray-500/20 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  从相册选择
                </span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Camera View */}
        {isCameraOpen && (
          <div className="animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full aspect-[3/4] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Camera Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-8 border-2 border-white/40 rounded-xl">
                  <div className="absolute top-0 left-4 -translate-y-1/2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-xs text-white font-medium">
                      对准标签拍摄
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={closeCamera}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={takePhoto}
                  className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <div className="w-13 h-13 rounded-full border-4 border-amber-500" />
                </button>
                <div className="w-10" />
              </div>
            </div>
          </div>
        )}

        {/* Preview & Analyzing */}
        {step === "preview" && imagePreview && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              <img
                src={imagePreview}
                alt="Label preview"
                className="w-full aspect-[4/3] object-cover"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-3 animate-pulse">
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </div>
                  <p className="text-white font-medium text-sm">
                    AI 正在识别标签...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Step */}
        {step === "form" && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 animate-slide-up"
          >
            {/* AI Badge */}
            {aiData && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-amber-700">
                  AI 已自动填充，请核对并修改
                </span>
                <Badge
                  variant="outline"
                  className="ml-auto text-[10px] border-amber-200 text-amber-600"
                >
                  置信度: {aiData.confidence === "high" ? "高" : aiData.confidence === "medium" ? "中" : "低"}
                </Badge>
              </div>
            )}

            {/* Image Thumbnail */}
            {imagePreview && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Label"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Product Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                产品名称
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="输入产品名称"
                className="h-11 rounded-xl border-gray-200 focus-visible:ring-amber-400"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Apple className="w-3.5 h-3.5 text-gray-400" />
                产品类别
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {categoryOptions.map((cat) => {
                  const Icon = categoryIcons[cat];
                  const isSelected = formData.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, category: cat }))
                      }
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all ${
                        isSelected
                          ? cat === "food"
                            ? "border-amber-400 bg-amber-50"
                            : cat === "medicine"
                            ? "border-sky-400 bg-sky-50"
                            : "border-emerald-400 bg-emerald-50"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected
                            ? cat === "food"
                              ? "text-amber-500"
                              : cat === "medicine"
                              ? "text-sky-500"
                              : "text-emerald-500"
                            : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {categoryLabels[cat]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                到期日期
              </Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                className="h-11 rounded-xl border-gray-200 focus-visible:ring-amber-400"
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                备注（可选）
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="添加备注信息..."
                className="rounded-xl border-gray-200 focus-visible:ring-amber-400 min-h-[80px] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setImagePreview(null);
                  setAiData(null);
                }}
                className="flex-1 h-12 rounded-xl border-gray-200 text-gray-600"
              >
                <X className="w-4 h-4 mr-1.5" />
                重新上传
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.name ||
                  !formData.expiryDate ||
                  createMutation.isPending
                }
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
