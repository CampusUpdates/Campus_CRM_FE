// Centralized fetch interceptor for automatic 401 Unauthorized handling
const originalFetch = window.fetch;

let isHandling401 = false;

window.fetch = async (...args: Parameters<typeof originalFetch>): Promise<Response> => {
  const response = await originalFetch(...args);

  if (response.status === 401) {
    const input = args[0];
    let url = "";

    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === "object" && "url" in input) {
      url = (input as Request).url;
    }

    // Do NOT trigger session expiration for public endpoints such as login
    const isPublicAuthEndpoint = url.includes("/auth/login");

    if (!isPublicAuthEndpoint) {
      if (!isHandling401) {
        isHandling401 = true;
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));

        // Reset flag after a short lock to prevent race conditions from concurrent 401s
        setTimeout(() => {
          isHandling401 = false;
        }, 2000);
      }
    }
  }

  return response;
};

export {};
