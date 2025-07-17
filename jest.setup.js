import "@testing-library/jest-dom";
import "whatwg-fetch";  // Polyfill for FETCH API (install fetch, Request, Response, Headers constructor class)

// MockReponse class (follows the Response interface): mock the Response class
class MockResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  async json() {
    return typeof this.body === "string" ? JSON.parse(this.body) : this.body;
  }

  async text() {
    return typeof this.body === "string"
      ? this.body
      : JSON.stringify(this.body);
  }

  // Add static json method to avoid NextJS internal calls
  static json(body, init) {
    return new MockResponse(JSON.stringify(body), init);
  }
}

// global Response class is being replaced by MockResponse class. 
// Whenever codes tries to use new Response(), it gonna use new MockReponse() instead
// NextResponse.json({success: false, error: "Données CV requises"}, {status: 400}) behind the scene = 
// return new Response(JSON.stringify({ success: false, error: "Données CV requises" }), {
//   status: 400,
//   headers: { 'Content-Type': 'application/json' }
// });
global.Response = MockResponse; 
global.Request = Request;  // Request class provided by the whatwf-fetch package

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "";
  },
}));

// Mock Supabase
jest.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Setup global test utilities
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});
