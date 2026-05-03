import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        关于
      </h1>

      <div className="mt-10 space-y-6 text-foreground/80 leading-relaxed">
        <p>
          我是一名 Web 开发者和设计师，关注 craftsmanship —— 构建快速、可访问且令人愉悦的产品。
        </p>

        <p>
          这是我的个人博客，主要记录关于 Web 开发、设计系统、排版以及一些技术探索的思考。我相信优秀的界面建立在扎实的基础上：清晰的排版、考究的间距，以及将性能视为产品特性。
        </p>

        <p>
          不写代码的时候，我喜欢阅读设计史、尝试新工具，或者参与开源项目。
        </p>

        <div className="pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            联系方式
          </h2>
          <div className="flex gap-6">
            <Link
              href="https://github.com"
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://twitter.com"
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              微博
            </Link>
            <Link
              href="mailto:hello@example.com"
              className="text-sm text-muted hover:text-accent transition-colors"
            >
              邮箱
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
