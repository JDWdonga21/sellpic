import React, { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createRoot } from "react-dom/client";
import { supabase } from "./lib/supabase";
import "../styles.css";

type PageName = "home" | "market" | "help";
type AuthMode = "login" | "signup";
type Category = "회화" | "사진" | "판화" | "조각" | "디지털" | "기타";
type PriceRange = "전체 가격" | "30만원 이하" | "30만원 - 70만원" | "70만원 이상";
type MarketView = "all" | "favorites" | "mine";

type Artwork = {
  id: string;
  sellerId: string | null;
  title: string;
  artist: string;
  price: number;
  category: Category;
  image: string;
  alt: string;
  description?: string | null;
  status?: string;
};

type ArtworkRow = {
  id: string;
  seller_id: string | null;
  title: string;
  description: string | null;
  category: Category;
  price: number;
  image_url: string | null;
  status: string;
  profiles?:
    | {
        display_name: string | null;
        username: string | null;
      }
    | Array<{
        display_name: string | null;
        username: string | null;
      }>
    | null;
};

type ArtworkFormValues = {
  title: string;
  description: string;
  category: Category;
  price: number;
  imageFile: File | null;
};

type FavoriteRow = {
  artwork_id: string;
};

type HelpItem = {
  title: string;
  body: string;
};

type NavigationHandler = (page: PageName) => void;
type AuthHandler = (mode?: AuthMode) => void;

const fallbackArtworks: Artwork[] = [
  {
    id: "sample-rhythm",
    sellerId: null,
    title: "Rhythm Field",
    artist: "Kim Yuna",
    price: 480000,
    category: "회화",
    image: "/assets/painting-rhythm.svg",
    alt: "붉은색과 청록색 추상 회화",
    status: "available",
  },
  {
    id: "sample-garden",
    sellerId: null,
    title: "Quiet Garden",
    artist: "Lee Haneul",
    price: 320000,
    category: "판화",
    image: "/assets/painting-garden.svg",
    alt: "녹색 정원 풍경 회화",
    status: "available",
  },
  {
    id: "sample-night",
    sellerId: null,
    title: "Blue Hour",
    artist: "Park Minseo",
    price: 260000,
    category: "사진",
    image: "/assets/painting-night.svg",
    alt: "어두운 도시 풍경 작품",
    status: "available",
  },
  {
    id: "sample-stone",
    sellerId: null,
    title: "Stone Memory",
    artist: "Choi Aram",
    price: 720000,
    category: "조각",
    image: "/assets/painting-stone.svg",
    alt: "돌 형태의 조각 작품",
    status: "available",
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

const categoryOptions: Category[] = ["회화", "사진", "판화", "조각", "디지털", "기타"];
const filterCategoryOptions: Array<"전체" | Category> = ["전체", ...categoryOptions];
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
  const [isArtworkModalOpen, setIsArtworkModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>(fallbackArtworks);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [appMessage, setAppMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAppMessage("Supabase Publishable key를 .env.local과 Netlify 환경변수에 설정하면 실제 데이터가 연결됩니다.");
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadArtworks();
  }, []);

  useEffect(() => {
    async function loadFavorites() {
      if (!supabase || !user) {
        setFavoriteIds(new Set());
        return;
      }

      const { data, error } = await supabase.from("favorites").select("artwork_id").eq("user_id", user.id);

      if (!error && data) {
        setFavoriteIds(new Set((data as FavoriteRow[]).map((favorite) => favorite.artwork_id)));
      }
    }

    loadFavorites();
  }, [user]);

  async function loadArtworks() {
    if (!supabase) {
      return;
    }

    setIsLoadingArtworks(true);
    const { data, error } = await supabase
      .from("artworks")
      .select("id,seller_id,title,description,category,price,image_url,status,profiles(display_name,username)")
      .order("created_at", { ascending: false });

    if (error) {
      setAppMessage(`작품 목록을 불러오지 못했습니다: ${error.message}`);
    } else if (data && data.length > 0) {
      setArtworks((data as ArtworkRow[]).map(mapArtworkRow));
      setAppMessage(null);
    } else {
      setArtworks([]);
    }

    setIsLoadingArtworks(false);
  }

  const navigate: NavigationHandler = (page) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAuth: AuthHandler = (mode = "login") => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  function openArtworkModal() {
    if (!user) {
      openAuth("login");
      return;
    }

    setIsArtworkModalOpen(true);
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setFavoriteIds(new Set());
  }

  async function handleCreateArtwork(values: ArtworkFormValues) {
    if (!supabase || !user) {
      throw new Error("로그인 후 작품을 등록할 수 있습니다.");
    }

    await ensureProfile(user);

    let imageUrl = "/assets/painting-rhythm.svg";

    if (values.imageFile) {
      const safeName = values.imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const filePath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("artworks")
        .upload(filePath, values.imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("artworks").getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("artworks").insert({
      seller_id: user.id,
      title: values.title,
      description: values.description || null,
      category: values.category,
      price: values.price,
      image_url: imageUrl,
      status: "available",
    });

    if (error) {
      throw error;
    }

    await loadArtworks();
    setAppMessage("작품이 등록되었습니다.");
  }

  async function handleDeleteArtwork(artworkId: string) {
    if (!supabase || !user) {
      return;
    }

    const { error } = await supabase.from("artworks").delete().eq("id", artworkId).eq("seller_id", user.id);

    if (error) {
      setAppMessage(`작품을 삭제하지 못했습니다: ${error.message}`);
      return;
    }

    setArtworks((current) => current.filter((artwork) => artwork.id !== artworkId));
    setAppMessage("작품이 삭제되었습니다.");
  }

  async function toggleFavorite(artworkId: string) {
    if (!user) {
      openAuth("login");
      return;
    }

    if (!supabase) {
      setAppMessage("Supabase 키 설정 후 찜 기능을 사용할 수 있습니다.");
      return;
    }

    const nextFavoriteIds = new Set(favoriteIds);

    if (nextFavoriteIds.has(artworkId)) {
      nextFavoriteIds.delete(artworkId);
      setFavoriteIds(nextFavoriteIds);
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("artwork_id", artworkId);

      if (error) {
        setAppMessage(`찜을 해제하지 못했습니다: ${error.message}`);
      }
      return;
    }

    nextFavoriteIds.add(artworkId);
    setFavoriteIds(nextFavoriteIds);
    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      artwork_id: artworkId,
    });

    if (error) {
      nextFavoriteIds.delete(artworkId);
      setFavoriteIds(new Set(nextFavoriteIds));
      setAppMessage(`찜을 저장하지 못했습니다: ${error.message}`);
    }
  }

  return (
    <>
      <Header
        activePage={activePage}
        user={user}
        onNavigate={navigate}
        onOpenAuth={openAuth}
        onSignOut={handleSignOut}
      />
      <main>
        {appMessage && <div className="app-message">{appMessage}</div>}
        {activePage === "home" && <HomePage artworks={artworks} onNavigate={navigate} onOpenAuth={openAuth} />}
        {activePage === "market" && (
          <MarketPage
            artworks={artworks}
            favoriteIds={favoriteIds}
            isLoading={isLoadingArtworks}
            user={user}
            onOpenAuth={openAuth}
            onOpenCreate={openArtworkModal}
            onDeleteArtwork={handleDeleteArtwork}
            onToggleFavorite={toggleFavorite}
          />
        )}
        {activePage === "help" && <HelpPage />}
      </main>
      <Footer />
      {isAuthOpen && (
        <AuthModal
          mode={authMode}
          onModeChange={setAuthMode}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={() => setIsAuthOpen(false)}
        />
      )}
      {isArtworkModalOpen && (
        <ArtworkModal
          onClose={() => setIsArtworkModalOpen(false)}
          onCreate={handleCreateArtwork}
        />
      )}
    </>
  );
}

async function ensureProfile(user: User) {
  if (!supabase) {
    return;
  }

  const displayName =
    typeof user.user_metadata.display_name === "string" && user.user_metadata.display_name
      ? user.user_metadata.display_name
      : user.email?.split("@")[0] || "Artist";

  await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    role: "artist",
  });
}

function mapArtworkRow(row: ArtworkRow): Artwork {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    artist: profile?.display_name || profile?.username || "Unknown Artist",
    price: row.price,
    category: row.category,
    image: row.image_url || "/assets/painting-rhythm.svg",
    alt: `${row.title} 작품 이미지`,
    description: row.description,
    status: row.status,
  };
}

type HeaderProps = {
  activePage: PageName;
  user: User | null;
  onNavigate: NavigationHandler;
  onOpenAuth: AuthHandler;
  onSignOut: () => void;
};

function Header({ activePage, user, onNavigate, onOpenAuth, onSignOut }: HeaderProps) {
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
        {user ? (
          <button className="nav-link nav-login" type="button" onClick={onSignOut}>
            로그아웃
          </button>
        ) : (
          <button className="nav-link nav-login" type="button" onClick={() => onOpenAuth("login")}>
            로그인
          </button>
        )}
      </nav>
    </header>
  );
}

type HomePageProps = {
  artworks: Artwork[];
  onNavigate: NavigationHandler;
  onOpenAuth: AuthHandler;
};

function HomePage({ artworks, onNavigate, onOpenAuth }: HomePageProps) {
  const displayArtworks = artworks.length >= 2 ? artworks : fallbackArtworks;
  const [main, side] = displayArtworks;

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
          <strong>{Math.max(artworks.length, fallbackArtworks.length).toLocaleString("ko-KR")}+</strong>
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
  favoriteIds: Set<string>;
  isLoading: boolean;
  user: User | null;
  onOpenAuth: AuthHandler;
  onOpenCreate: () => void;
  onDeleteArtwork: (artworkId: string) => void;
  onToggleFavorite: (artworkId: string) => void;
};

function MarketPage({
  artworks,
  favoriteIds,
  isLoading,
  user,
  onOpenAuth,
  onOpenCreate,
  onDeleteArtwork,
  onToggleFavorite,
}: MarketPageProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"전체" | Category>("전체");
  const [priceRange, setPriceRange] = useState<PriceRange>("전체 가격");
  const [marketView, setMarketView] = useState<MarketView>("all");

  const filteredArtworks = useMemo(() => {
    return artworks.filter((artwork) => {
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
      const matchesView =
        marketView === "all" ||
        (marketView === "favorites" && favoriteIds.has(artwork.id)) ||
        (marketView === "mine" && artwork.sellerId === user?.id);

      return matchesQuery && matchesCategory && matchesPrice && matchesView;
    });
  }, [artworks, category, favoriteIds, marketView, priceRange, query, user?.id]);

  return (
    <section className="page active" aria-labelledby="market-title">
      <div className="section-heading">
        <p className="eyebrow">Marketplace</p>
        <h2 id="market-title">장터</h2>
        <p>필터를 훑고 마음에 드는 작품을 빠르게 비교할 수 있도록 구성했습니다.</p>
      </div>

      <div className="market-layout">
        <aside className="filters" aria-label="작품 필터">
          <div className="view-tabs" aria-label="장터 보기">
            <button className={marketView === "all" ? "active" : ""} type="button" onClick={() => setMarketView("all")}>
              전체
            </button>
            <button
              className={marketView === "favorites" ? "active" : ""}
              type="button"
              onClick={() => (user ? setMarketView("favorites") : onOpenAuth("login"))}
            >
              찜
            </button>
            <button
              className={marketView === "mine" ? "active" : ""}
              type="button"
              onClick={() => (user ? setMarketView("mine") : onOpenAuth("login"))}
            >
              내 작품
            </button>
          </div>
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
              {filterCategoryOptions.map((option) => (
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
          <button className="primary-action full" type="button" onClick={onOpenCreate}>
            작품 등록
          </button>
        </aside>

        <div className="art-grid">
          {isLoading && <p className="empty-state">작품을 불러오는 중입니다.</p>}
          {!isLoading &&
            filteredArtworks.map((artwork) => (
              <ArtworkCard
                artwork={artwork}
                isFavorite={favoriteIds.has(artwork.id)}
                isOwner={artwork.sellerId === user?.id}
                key={artwork.id}
                onDeleteArtwork={onDeleteArtwork}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          {!isLoading && filteredArtworks.length === 0 && (
            <p className="empty-state">조건에 맞는 작품이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}

type ArtworkCardProps = {
  artwork: Artwork;
  isFavorite: boolean;
  isOwner: boolean;
  onDeleteArtwork: (artworkId: string) => void;
  onToggleFavorite: (artworkId: string) => void;
};

function ArtworkCard({ artwork, isFavorite, isOwner, onDeleteArtwork, onToggleFavorite }: ArtworkCardProps) {
  return (
    <article className="art-card">
      <div className="art-image-wrap">
        <img src={artwork.image} alt={`${artwork.title} 작품 이미지`} />
        <button
          className={`favorite-button ${isFavorite ? "active" : ""}`}
          type="button"
          onClick={() => onToggleFavorite(artwork.id)}
          aria-label={isFavorite ? "찜 해제" : "찜하기"}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="art-info">
        <span className="tag">{artwork.category}</span>
        <h3>{artwork.title}</h3>
        <p>{artwork.artist}</p>
        <strong>{currency.format(artwork.price)}</strong>
        {isOwner && (
          <button className="text-danger" type="button" onClick={() => onDeleteArtwork(artwork.id)}>
            삭제
          </button>
        )}
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
  onAuthSuccess: () => void;
};

function AuthModal({ mode, onModeChange, onClose, onAuthSuccess }: AuthModalProps) {
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

        {mode === "login" ? (
          <LoginForm onAuthSuccess={onAuthSuccess} />
        ) : (
          <SignupForm onAuthSuccess={onAuthSuccess} />
        )}
      </section>
    </div>
  );
}

type AuthFormProps = {
  onAuthSuccess: () => void;
};

function LoginForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase Publishable key를 먼저 설정해주세요.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    onAuthSuccess();
  }

  return (
    <form className="auth-form active" onSubmit={handleSubmit}>
      <h2 id="auth-title">로그인</h2>
      <label>
        이메일
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message && <p className="form-message">{message}</p>}
      <button className="primary-action full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중" : "로그인"}
      </button>
    </form>
  );
}

function SignupForm({ onAuthSuccess }: AuthFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase Publishable key를 먼저 설정해주세요.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setIsSubmitting(false);
      setMessage(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        display_name: displayName,
        role: "artist",
      });
    }

    setIsSubmitting(false);
    setMessage("가입 확인 메일을 확인해주세요.");
    onAuthSuccess();
  }

  return (
    <form className="auth-form active" onSubmit={handleSubmit}>
      <h2 id="auth-title">가입</h2>
      <label>
        이름
        <input
          type="text"
          placeholder="홍길동"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          required
        />
      </label>
      <label>
        이메일
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          placeholder="8자 이상"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </label>
      {message && <p className="form-message">{message}</p>}
      <button className="primary-action full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "가입 중" : "가입하기"}
      </button>
    </form>
  );
}

type ArtworkModalProps = {
  onClose: () => void;
  onCreate: (values: ArtworkFormValues) => Promise<void>;
};

function ArtworkModal({ onClose, onCreate }: ArtworkModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("회화");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setMessage("가격을 올바르게 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await onCreate({
        title,
        description,
        category,
        price: Math.round(numericPrice),
        imageFile,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "작품을 등록하지 못했습니다.";
      setMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal open" aria-hidden="false">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="닫기" />
      <section className="auth-panel wide-panel" role="dialog" aria-modal="true" aria-labelledby="artwork-title">
        <button className="close-button" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <form className="auth-form active" onSubmit={handleSubmit}>
          <h2 id="artwork-title">작품 등록</h2>
          <label>
            작품명
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            설명
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
          </label>
          <label>
            카테고리
            <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
              {categoryOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label>
            가격
            <input
              type="number"
              min="0"
              step="1000"
              placeholder="480000"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
          </label>
          <label>
            대표 이미지
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {message && <p className="form-message">{message}</p>}
          <button className="primary-action full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "등록 중" : "등록하기"}
          </button>
        </form>
      </section>
    </div>
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
