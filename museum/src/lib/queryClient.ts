import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as mockStore from "./mockStore";

// Museum mode: All API requests are mocked
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Handle different endpoints
  if (url === "/api/login") {
    const { username, password } = data as any;
    const user = mockStore.login(username, password);
    return new Response(JSON.stringify(user), { status: 200 });
  }

  if (url === "/api/register") {
    const { username, password, onboarding } = data as any;
    const user = mockStore.register(username, password, onboarding);
    return new Response(JSON.stringify(user), { status: 200 });
  }

  if (url === "/api/logout") {
    mockStore.logout();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (url === "/api/generate-profile") {
    const user = mockStore.getUser();
    return new Response(JSON.stringify({ profileDescription: user?.profileDescription }), { status: 200 });
  }

  if (url === "/api/colleges" && method === "POST") {
    const { name, status } = data as any;
    const college = mockStore.addCollege(name, status);
    return new Response(JSON.stringify(college), { status: 200 });
  }

  if (url.startsWith("/api/colleges/") && url.includes("/status")) {
    const collegeId = parseInt(url.split("/")[3]);
    const { status } = data as any;
    const college = mockStore.updateCollegeStatus(collegeId, status);
    return new Response(JSON.stringify(college), { status: 200 });
  }

  if (url.startsWith("/api/colleges/") && method === "DELETE") {
    const collegeId = parseInt(url.split("/")[3]);
    mockStore.deleteCollege(collegeId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (url === "/api/recommendations/generate") {
    const recs = mockStore.generateRecommendations();
    return new Response(JSON.stringify(recs), { status: 200 });
  }

  if (url.startsWith("/api/recommendations/") && url.includes("/convert")) {
    const recId = parseInt(url.split("/")[3]);
    const { status } = data as any;
    const college = mockStore.convertRecommendationToCollege(recId, status);
    return new Response(JSON.stringify(college), { status: 200 });
  }

  if (url.startsWith("/api/recommendations/") && method === "DELETE") {
    const recId = parseInt(url.split("/")[3]);
    mockStore.deleteRecommendation(recId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (url === "/api/advisors" && method === "POST") {
    const { name, type } = data as any;
    const advisor = mockStore.createAdvisor(name, type);
    return new Response(JSON.stringify(advisor), { status: 200 });
  }

  if (url.startsWith("/api/advisors/") && url.includes("/status")) {
    const advisorId = parseInt(url.split("/")[3]);
    const { isActive } = data as any;
    const advisor = mockStore.updateAdvisorStatus(advisorId, isActive);
    return new Response(JSON.stringify(advisor), { status: 200 });
  }

  if (url.startsWith("/api/advisors/") && method === "DELETE") {
    const advisorId = parseInt(url.split("/")[3]);
    mockStore.deleteAdvisor(advisorId);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  // For advisor sharing features - just return empty success
  if (url.includes("/share-chats") || url.includes("/shared-chats") || url.includes("/unshare-chats")) {
    return new Response(JSON.stringify({ success: true, sessions: [] }), { status: 200 });
  }

  if (url === "/api/message-feedback") {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  // Handle GET /api/user
  if (url === "/api/user" && method === "GET") {
    const user = mockStore.getUser();
    if (user) {
      return new Response(JSON.stringify(user), { status: 200 });
    }
    return new Response(JSON.stringify(null), { status: 401 });
  }

  // Default response
  return new Response(JSON.stringify({}), { status: 200 });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Handle different GET endpoints
    if (url === "/api/me" || url === "/api/user") {
      const user = mockStore.getUser();
      if (!user && unauthorizedBehavior === "returnNull") {
        return null as T;
      }
      return user as T;
    }

    if (url === "/api/colleges") {
      return mockStore.getColleges() as T;
    }

    if (url === "/api/recommendations") {
      return mockStore.getRecommendations() as T;
    }

    if (url === "/api/advisors") {
      return mockStore.getAdvisors() as T;
    }

    if (url.startsWith("/api/shared/")) {
      const shareToken = url.split("/")[3];
      return mockStore.getSharedProfileData(shareToken) as T;
    }

    return [] as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
