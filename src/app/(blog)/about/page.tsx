import { getSiteConfig } from "@/lib/config";
import { GitHubIcon, XIcon, EmailIcon } from "@/components/blog/PlatformIcons";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const config = await getSiteConfig();
  const { about } = config;

  const paragraphs = about.introduction
    .split("\n")
    .filter((p) => p.trim());

  const socialLinks = [
    { href: about.github, icon: GitHubIcon, label: "GitHub", show: !!about.github },
    { href: about.x, icon: XIcon, label: "X", show: !!about.x },
    { href: `mailto:${about.email}`, icon: EmailIcon, label: "邮箱", show: !!about.email },
  ].filter((l) => l.show);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
      {/* Avatar */}
      {about.avatar && (
        <div className="mb-8 flex justify-center sm:justify-start">
          <img
            src={about.avatar}
            alt="avatar"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-border"
          />
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
        关于
      </h1>

      {/* Introduction */}
      {paragraphs.length > 0 && (
        <div className="mt-10 space-y-6 text-foreground/80 leading-relaxed">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground mb-4">联系方式</h2>
          <div className="flex flex-wrap gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                  border border-border text-sm text-muted hover:text-accent
                  hover:border-accent/30 transition-all"
              >
                <link.icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state: nothing configured */}
      {!about.avatar && paragraphs.length === 0 && socialLinks.length === 0 && (
        <p className="mt-10 text-muted text-center py-12">
          还没有填写个人信息，请前往后台设置。
        </p>
      )}
    </div>
  );
}
