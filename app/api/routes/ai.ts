import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { env } from "../lib/env";

interface AIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export const aiRouter = createRouter({
  analyzeLabel: publicQuery
    .input(
      z.object({
        imageUrl: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const apiKey = env.kimiApiKey || process.env.KIMI_API_KEY || "";
        const apiUrl = env.kimiApiUrl || "https://api.moonshot.cn/v1";

        const response = await fetch(`${apiUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k-vision-preview",
            messages: [
              {
                role: "system",
                content:
                  '你是一个专门识别食品、药品和补品标签的助手。你需要从图片中提取以下信息并以JSON格式返回：\n{\n  "name": "产品名称（尽量识别完整）",\n  "category": "类别（food/medicine/supplement 三选一）",\n  "expiryDate": "到期日期，格式为 YYYY-MM-DD",\n  "confidence": "high/medium/low"\n}\n如果某个字段无法识别，设为null。注意：食品类别请用 food，药品用 medicine，补品/保健食品用 supplement。',
              },
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: input.imageUrl },
                  },
                  {
                    type: "text",
                    text: "请识别这个标签上的产品名称、类别和到期日期。",
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`AI API error: ${errorText}`);
        }

        const data = await response.json() as AIResponse;
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error("Empty response from AI");
        }

        const parsed = JSON.parse(content);
        return {
          name: parsed.name || null,
          category: parsed.category || null,
          expiryDate: parsed.expiryDate || null,
          confidence: parsed.confidence || "low",
        };
      } catch (error) {
        console.error("AI analysis error:", error);
        return {
          name: null,
          category: null,
          expiryDate: null,
          confidence: "low",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),
});
