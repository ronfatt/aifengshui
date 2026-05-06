import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Gift, ShoppingBag } from "lucide-react";
import { AppShell, StatusPill } from "@/components/shell";
import { dashboardProducts } from "@/lib/data";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return dashboardProducts.map((product) => ({
    slug: product.slug
  }));
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = dashboardProducts.find((item) => item.slug === slug) || dashboardProducts[0];

  return (
    <AppShell>
      <main className="px-5 py-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-ink/62 hover:text-cinnabar">
            <ArrowLeft className="size-4" /> 返回会员端
          </Link>

          <section className="mt-5 grid overflow-hidden rounded border border-black/10 bg-white shadow-sm lg:grid-cols-[1fr_0.9fr]">
            <img src={product.image} alt={product.name} className="h-full min-h-[420px] w-full object-cover" />
            <div className="p-6 md:p-10">
              <StatusPill>{product.category}</StatusPill>
              <h1 className="mt-4 text-4xl font-semibold md:text-6xl">{product.name}</h1>
              <p className="mt-5 text-lg leading-8 text-ink/68">{product.description}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-black/10 bg-cloud p-4">
                  <p className="text-sm text-ink/55">售价</p>
                  <p className="mt-2 text-3xl font-semibold text-cinnabar">{product.price}</p>
                </div>
                <div className="rounded border border-gold/35 bg-gold/10 p-4">
                  <Gift className="size-5 text-gold" />
                  <p className="mt-2 font-semibold">{product.points}</p>
                </div>
              </div>

              <div className="mt-6 rounded border border-black/10 p-4">
                <p className="text-sm font-semibold text-ink">适合谁</p>
                <p className="mt-2 leading-7 text-ink/62">{product.idealFor}</p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {product.highlights.map((item) => (
                  <p key={item} className="flex gap-2 rounded bg-cloud px-3 py-3 text-sm text-ink/72">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-cinnabar" />
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded bg-cinnabar px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0F7F88]">
                  <CreditCard className="size-4" /> 立即购买
                </button>
                <button className="inline-flex items-center gap-2 rounded border border-black/10 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-cloud">
                  <ShoppingBag className="size-4" /> 加入清单
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
