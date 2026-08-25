"use client";

import { useEffect, useMemo, useState } from "react";

const navItems = [
  { id: "home", label: "首页", icon: "⌂" },
  { id: "work", label: "作品", icon: "◇" },
  { id: "about", label: "关于", icon: "◎" },
  { id: "contact", label: "联系", icon: "↗" },
];

const projects = [
  {
    number: "01",
    title: "Lumen 个人工作台",
    category: "概念项目 · 效率工具",
    description:
      "把任务、日程与随手记录收进一张安静的工作台，减少切换，让注意力留在真正重要的事情上。",
    tags: ["Product Design", "Interface", "Interaction"],
    tone: "sun",
  },
  {
    number: "02",
    title: "Tide 城市天气",
    category: "概念项目 · 数据体验",
    description:
      "不只展示温度，也用颜色、形状与节奏表达一天的天气变化，让预报更直观、更有情绪。",
    tags: ["Data Visualisation", "Responsive UI", "Motion"],
    tone: "tide",
  },
  {
    number: "03",
    title: "Orbit 灵感档案",
    category: "概念项目 · 数字收藏",
    description:
      "一个用于保存图像、文字与网页片段的视觉档案，让散落的灵感重新建立联系。",
    tags: ["Creative Coding", "Design System", "Prototype"],
    tone: "orbit",
  },
];

const capabilities = [
  {
    icon: "✦",
    title: "视觉系统",
    description:
      "从色彩、字体、形状到间距，把零散的视觉选择整理成一致、可扩展的界面语言。",
  },
  {
    icon: "⌘",
    title: "前端实现",
    description:
      "用语义化结构、响应式布局和可维护的组件，把设计还原为真实、流畅的网页体验。",
  },
  {
    icon: "≈",
    title: "交互与原型",
    description:
      "通过状态变化、微动效和快速原型验证想法，让每一次反馈都自然、有意义。",
  },
];

type Theme = "light" | "dark";

export default function Home() {
  const [theme, setTheme] = useState<Theme>("light");
  const [activeSection, setActiveSection] = useState("home");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const initialTheme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(initialTheme);

    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-24% 0px -58% 0px", threshold: [0.08, 0.35, 0.7] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const timeText = useMemo(
    () =>
      now?.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }) ?? "--:--",
    [now],
  );

  const dateText = useMemo(
    () =>
      now?.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      }) ?? "--/--",
    [now],
  );

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("portfolio-theme", nextTheme);
  };

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>

      <aside className="navigation-rail" aria-label="主要导航">
        <a className="brand-mark" href="#home" aria-label="返回首页">
          Y
        </a>

        <div className="rail-clock" aria-label={`当前时间 ${timeText}`}>
          <strong>{timeText}</strong>
          <span>{dateText}</span>
        </div>

        <nav className="rail-nav">
          {navItems.map((item) => (
            <a
              className={`rail-link ${activeSection === item.id ? "active" : ""}`}
              href={`#${item.id}`}
              key={item.id}
              aria-current={activeSection === item.id ? "page" : undefined}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "切换至深色主题" : "切换至浅色主题"}
          title={theme === "light" ? "深色主题" : "浅色主题"}
        >
          <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
        </button>
      </aside>

      <header className="mobile-topbar">
        <a className="mobile-brand" href="#home" aria-label="返回首页">
          <span>Y</span>
          <strong>你的作品集</strong>
        </a>
        <button
          className="mobile-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "切换至深色主题" : "切换至浅色主题"}
        >
          <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
        </button>
      </header>

      <main id="main-content">
        <section className="hero section" id="home" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="status-dot" aria-hidden="true" />
              设计、代码，以及一点好奇心
            </div>
            <h1 id="hero-title">
              把想法做成
              <span>清晰、好用，</span>
              也有一点惊喜的体验。
            </h1>
            <p className="hero-intro">
              你好，我是 <strong>你的名字</strong>。我关注界面设计与前端实现，喜欢用鲜明的视觉、自然的动效和克制的细节，让复杂内容更容易理解。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">
                看看作品 <span aria-hidden="true">↓</span>
              </a>
              <a className="button button-secondary" href="#about">
                认识我
              </a>
            </div>
            <p className="hero-note">
              <span aria-hidden="true">✦</span> 正在构建新的作品与实验
            </p>
          </div>

          <div className="hero-canvas" aria-label="个人品牌视觉占位区">
            <div className="canvas-grid" aria-hidden="true" />
            <div className="floating-shape shape-one" aria-hidden="true" />
            <div className="floating-shape shape-two" aria-hidden="true" />
            <div className="floating-shape shape-three" aria-hidden="true" />
            <div className="identity-lockup">
              <div className="identity-stamp" aria-hidden="true">
                Y
              </div>
              <div className="identity-card">
                <span>Hello, 我是</span>
                <strong>YOUR NAME</strong>
                <small>DESIGN × FRONTEND</small>
              </div>
            </div>
            <p className="canvas-caption">Designing with intent. Building with care.</p>
          </div>
        </section>

        <section className="work section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">精选实验 · 01—03</p>
              <h2 id="work-title">把过程也放进作品里。</h2>
            </div>
            <p>
              这些是用于首版网站的概念项目。之后可替换成你的真实案例、研究过程与成果链接。
            </p>
          </div>

          <div className="project-grid">
            {projects.map((project) => (
              <article className="project-card" data-tone={project.tone} key={project.number}>
                <div className="project-visual" aria-hidden="true">
                  {project.tone === "sun" && (
                    <div className="lumen-demo">
                      <div className="lumen-topline"><span /><span /><span /></div>
                      <div className="lumen-note note-a">Today</div>
                      <div className="lumen-note note-b">Focus</div>
                      <div className="lumen-timeline"><i /><i /><i /><i /></div>
                    </div>
                  )}
                  {project.tone === "tide" && (
                    <div className="tide-demo">
                      <div className="weather-orbit"><span>24°</span></div>
                      <div className="weather-line"><i /><i /><i /><i /><i /></div>
                      <p>SHANGHAI · CLEAR</p>
                    </div>
                  )}
                  {project.tone === "orbit" && (
                    <div className="orbit-demo">
                      <div className="orbit-ring ring-a" />
                      <div className="orbit-ring ring-b" />
                      <div className="orbit-tile tile-a">Aa</div>
                      <div className="orbit-tile tile-b">✦</div>
                      <div className="orbit-tile tile-c">08</div>
                    </div>
                  )}
                </div>

                <div className="project-content">
                  <div className="project-meta">
                    <span>{project.number}</span>
                    <span>{project.category}</span>
                  </div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-footer">
                    <ul aria-label={`${project.title} 使用的领域与技术`}>
                      {project.tags.map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <span className="concept-label">概念预览 <b aria-hidden="true">↗</b></span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about section" id="about" aria-labelledby="about-title">
          <div className="about-intro">
            <p className="section-kicker">关于我 · ABOUT</p>
            <h2 id="about-title">我喜欢站在设计与开发之间。</h2>
            <p>
              我对“它看起来怎样”和“它使用起来怎样”同样感兴趣。这里会记录我的项目、界面实验与正在学习的东西。现在展示的是网站雏形，之后可以逐步替换成真实作品与经历。
            </p>
            <div className="about-tags" aria-label="关注领域">
              {[
                "Material 3",
                "UI / UX",
                "Creative Frontend",
                "持续学习中",
              ].map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="capability-grid">
            {capabilities.map((capability) => (
              <article className="capability-card" key={capability.title}>
                <span className="capability-icon" aria-hidden="true">
                  {capability.icon}
                </span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
            <article className="site-stats" aria-label="当前网站特性">
              <div><strong>04</strong><span>核心区块</span></div>
              <div><strong>02</strong><span>明暗主题</span></div>
              <div><strong>100%</strong><span>响应式布局</span></div>
            </article>
          </div>
        </section>

        <section className="contact section" id="contact" aria-labelledby="contact-title">
          <div className="contact-orbit" aria-hidden="true">
            <span>LET&apos;S TALK · 一起创造 · LET&apos;S TALK ·</span>
          </div>
          <div className="contact-copy">
            <p className="section-kicker">保持联系 · CONTACT</p>
            <h2 id="contact-title">有一个值得认真做的小想法？</h2>
            <p>
              无论是交流设计、讨论网页，还是分享一件有趣的作品，都欢迎从一封简短的邮件开始。
            </p>
            <div className="contact-actions">
              <a className="button button-contact" href="mailto:hello@yourname.com">
                发送邮件 <span aria-hidden="true">↗</span>
              </a>
              <span className="email-placeholder">hello@yourname.com · 请替换为你的邮箱</span>
            </div>
          </div>
          <footer>
            <span>© 2026 YOUR NAME</span>
            <span>用好奇心设计，用耐心完成。</span>
          </footer>
        </section>
      </main>

      <nav className="mobile-nav" aria-label="移动端主要导航">
        {navItems.map((item) => (
          <a
            className={activeSection === item.id ? "active" : ""}
            href={`#${item.id}`}
            key={item.id}
            aria-current={activeSection === item.id ? "page" : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.label}</small>
          </a>
        ))}
      </nav>
    </div>
  );
}
