import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../styles.css";

type PageName = "home" | "market" | "help";
type AuthMode = "login" | "signup";
type Category = "회화" | "사진" | "판화" | "조각";
type PriceRange = "전체 가격" | "30만원 이하" | "30만원 - 70만원" | "70만원 이상";

type Artwork = {
  id: number;
  title: string;
  artist: string;
  price: number;
  category: Category;
  image: string;
  alt: string;
};

type HelpItem = {
  title: string;
  body: string;
};

type NavigationHandler = (page: PageName) => void;
type AuthHandler = (mode?: AuthMode) => void;

const artworks: Artwork[] = [
  {
    id: 1,
    title: "Rhythm Field",
    artist: "Kim Yuna",
    price: 480000,
    category: "회화",
    image: "/assets/painting-rhythm.svg",
    alt: "붉은색과 청록색 추상 회화",
  },
  {
    id: 2,
    title: "Quiet Garden",
    artist: "Lee Haneul",
    price: 320000,
    category: "판화",
    image: "/assets/painting-garden.svg",
    alt: "녹색 정원 풍경 회화",
  },
  {
    id: 3,
    title: "Blue Hour",
    artist: "Park Minseo",
    price: 260000,
    category: "사진",
    image: "/assets/painting-night.svg",
    alt: "어두운 도시 풍경 작품",
  },
  {
    id: 4,
    title: "Stone Memory",
    artist: "Choi Aram",
    price: 720000,
    category: "조각",
    image: "/assets/painting-stone.svg",
    alt: "돌 형태의 조각 작품",
  },
];

const helpItems: HelpItem[] = [
  {
    title: "작품은 어떻게 구매하나요?",
    body: "장터에서 작품을 선택한 뒤 결제 요청을 진행합니다. 배송 정보 확인 후 판매자가 발송합니다.",
  },
  {
    title: "작품 판매 등록은 어디서 하나요?",
    body: "로그인 후 장터 화면의 작품 등록 버튼을 통해 작품 이미지, 설명, 가격을 입력합니다.",
  },
  {
    title: "거래 안전 장치는 무엇인가요?",
    body: "구매 확정 전까지 결제 금액을 보관하고, 작품 수령 확인 후 판매자에게 정산되는 흐름을 가정한 UI입니다.",
  },
];

const categoryOptions: Array<"전체" | Category> = ["전체", "회화", "사진", "판화", "조각"];
const priceOptions: PriceRange[] = ["전체 가격", "30만원 이하", "30만원 - 70만원", "70만원 이상"];

const currency = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function App() {
  const [activePage, setActivePage] = useState<PageName>("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const navigate: NavigationHandler = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAuth: AuthHandler = (mode = "login") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <>
      <Header activePage={activePage} onNavigate={navigate} onOpenAuth={openAuth} />
      <main>
        {activePage === "home" && <HomePage onNavigate={navigate} onOpenAuth={openAuth} />}
        {activePage === "market" && <MarketPage artworks={artworks} onOpenAuth={openAuth} />}
        {activePage === "help" && <HelpPage />}
      </main>
      <Footer />
      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setIsAuthOpen(false)}
        />
      )}
    </>
  );
}

type HeaderProps = {
  activePage: PageName;
  onNavigate: NavigationHandler;
  onOpenAuth: AuthHandler;
};

function Header({ activePage, onNavigate, onOpenAuth }: HeaderProps) {
  const navItems: Array<{ page: PageName; label: string }> = [
    { page: "home", label: "홈" },
    { page: "market", label: "장터" },
    { page: "help", label: "도움말" },
  ];

  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={() => onNavigate("home")} aria-label="Art Yard 홈">
        <span className="brand-mark">A</span>
        <span>Art Yard</span>
      </button>

      <nav className="nav-tabs" aria-label="주요 메뉴">
        {navItems.map((item) => (
          <button
            className={`nav-link ${activePage === item.page ? "active" : ""}`}
            type="button"
            key={item.page}
            onClick={() => onNavigate(item.page)}
          >
            {item.label}
          </button>
        ))}
        <button className="nav-link nav-login" type="button" onClick={() => onOpenAuth("login")}>
          로그인
        </button>
      </nav>
    </header>
  );
}

type HomePageProps = {
  onNavigate: NavigationHandler;
  onOpenAuth: AuthHandler;
};

function HomePage({ onNavigate, onOpenAuth }: HomePageProps) {
  const [main, side] = artworks;

  return (
    <section className="page active" aria-labelledby="home-title">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Curated Art Marketplace</p>
          <h1 id="home-title">작품을 발견하고, 소장하고, 판매하는 온라인 미술 장터</h1>
          <p>
            신진 작가의 회화부터 소장 가치 높은 한정판 프린트까지 한곳에서 둘러보고
            안전하게 거래할 수 있는 UI 경험입니다.
          </p>
          <div className="hero-actions">
            <button className="primary-action" type="button" onClick={() => onNavigate("market")}>
              작품 둘러보기
            </button>
            <button className="secondary-action" type="button" onClick={() => onOpenAuth("signup")}>
              작가로 가입
            </button>
          </div>
        </div>
        <div className="hero-gallery" aria-label="대표 작품 미리보기">
          <FeaturedArtwork artwork={main} className="main-art" />
          <FeaturedArtwork artwork={side} className="side-art" />
        </div>
      </div>

      <section className="home-band" aria-label="서비스 요약">
        <div>
          <strong>1,280+</strong>
          <span>등록 작품</span>
        </div>
        <div>
          <strong>420+</strong>
          <span>활동 작가</span>
        </div>
        <div>
          <strong>안전 결제</strong>
          <span>구매 확정 후 정산</span>
        </div>
      </section>
    </section>
  );
}

type FeaturedArtworkProps = {
  artwork: Artwork;
  className: string;
};

function FeaturedArtwork({ artwork, className }: FeaturedArtworkProps) {
  return (
    <article className={`featured-art ${className}`}>
      <img src={artwork.image} alt={artwork.alt} />
      <div>
        <strong>{artwork.title}</strong>
        <span>
          {artwork.artist} · {currency.format(artwork.price)}
        </span>
      </div>
    </article>
  );
}

type MarketPageProps = {
  artworks: Artwork[];
  onOpenAuth: AuthHandler;
};

function MarketPage({ artworks: items, onOpenAuth }: MarketPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"전체" | Category>("전체");
  const [priceRange, setPriceRange] = useState<PriceRange>("전체 가격");

  const filteredArtworks = useMemo(() => {
    return items.filter((artwork) => {
      const lowerQuery = query.trim().toLowerCase();
      const matchesQuery =
        !lowerQuery ||
        artwork.title.toLowerCase().includes(lowerQuery) ||
        artwork.artist.toLowerCase().includes(lowerQuery);
      const matchesCategory = category === "전체" || artwork.category === category;
      const matchesPrice =
        priceRange === "전체 가격" ||
        (priceRange === "30만원 이하" && artwork.price <= 300000) ||
        (priceRange === "30만원 - 70만원" && artwork.price > 300000 && artwork.price <= 700000) ||
        (priceRange === "70만원 이상" && artwork.price > 700000);

      return matchesQuery && matchesCategory && matchesPrice;
    });
  }, [category, items, priceRange, query]);

  return (
    <section className="page active" aria-labelledby="market-title">
      <div className="section-heading">
        <p className="eyebrow">Marketplace</p>
        <h2 id="market-title">장터</h2>
        <p>필터를 훑고 마음에 드는 작품을 빠르게 비교할 수 있도록 구성했습니다.</p>
      </div>

      <div className="market-layout">
        <aside className="filters" aria-label="작품 필터">
          <label>
            검색
            <input
              type="search"
              placeholder="작품명, 작가명"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label>
            카테고리
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as "전체" | Category)}
            >
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            가격대
            <select
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value as PriceRange)}
            >
              {priceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <button className="primary-action full" type="button" onClick={() => onOpenAuth("login")}>
            작품 등록
          </button>
        </aside>

        <div className="art-grid">
          {filteredArtworks.map((artwork) => (
            <ArtworkCard artwork={artwork} key={artwork.id} />
          ))}
          {filteredArtworks.length === 0 && (
            <p className="empty-state">조건에 맞는 작품이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}

type ArtworkCardProps = {
  artwork: Artwork;
};

function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <article className="art-card">
      <img src={artwork.image} alt={`${artwork.title} 작품 이미지`} />
      <div className="art-info">
        <span className="tag">{artwork.category}</span>
        <h3>{artwork.title}</h3>
        <p>{artwork.artist}</p>
        <strong>{currency.format(artwork.price)}</strong>
      </div>
    </article>
  );
}

function HelpPage() {
  return (
    <section className="page active" aria-labelledby="help-title">
      <div className="section-heading">
        <p className="eyebrow">Help Center</p>
        <h2 id="help-title">도움말</h2>
        <p>구매자와 판매자가 거래 흐름을 쉽게 이해할 수 있도록 핵심 안내를 정리했습니다.</p>
      </div>

      <div className="help-list">
        {helpItems.map((item, index) => (
          <details open={index === 0} key={item.title}>
            <summary>{item.title}</summary>
            <p>{item.body}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Art Yard</strong>
        <p>작가와 컬렉터를 잇는 온라인 미술 장터</p>
      </div>
      <div className="footer-links">
        <a href="#">이용약관</a>
        <a href="#">개인정보처리방침</a>
        <a href="#">문의하기</a>
      </div>
    </footer>
  );
}

type AuthModalProps = {
  mode: AuthMode;
  onModeChange: React.Dispatch<React.SetStateAction<AuthMode>>;
  onClose: () => void;
};

function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal open" aria-hidden="false">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="닫기" />
      <section className="auth-panel" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="close-button" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <div className="auth-tabs" role="tablist" aria-label="인증 선택">
          <button
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            type="button"
            onClick={() => onModeChange("login")}
          >
            로그인
          </button>
          <button
            className={`auth-tab ${mode === "signup" ? "active" : ""}`}
            type="button"
            onClick={() => onModeChange("signup")}
          >
            가입
          </button>
        </div>

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </section>
    </div>
  );
}

function LoginForm() {
  return (
    <form className="auth-form active">
      <h2 id="auth-title">로그인</h2>
      <label>
        이메일
        <input type="email" placeholder="you@example.com" />
      </label>
      <label>
        비밀번호
        <input type="password" placeholder="비밀번호" />
      </label>
      <button className="primary-action full" type="button">
        로그인
      </button>
    </form>
  );
}

function SignupForm() {
  return (
    <form className="auth-form active">
      <h2 id="auth-title">가입</h2>
      <label>
        이름
        <input type="text" placeholder="홍길동" />
      </label>
      <label>
        이메일
        <input type="email" placeholder="you@example.com" />
      </label>
      <label>
        비밀번호
        <input type="password" placeholder="8자 이상" />
      </label>
      <button className="primary-action full" type="button">
        가입하기
      </button>
    </form>
  );
}

const rootElement = document.querySelector("#root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
