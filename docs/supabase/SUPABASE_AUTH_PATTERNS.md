# Supabase Server-Side Authentication Patterns

This document outlines three different approaches for handling user authentication and file operations with Supabase from server-side API routes in Next.js.

## Overview

In server-side environments, there's no persistent session context like in client-side applications where the session is stored in localStorage. This means every server request to Supabase needs explicit authentication handling.

## Understanding the Supabase Session Object

Before diving into authentication patterns, it's crucial to understand what a Supabase session contains and how it's structured.

### What is a Session?

A Supabase session is an object that contains:
- **Access Token (JWT)**: Used for authenticating API requests
- **Refresh Token**: Used to obtain new access tokens when they expire
- **User Information**: Details about the authenticated user
- **Expiration Data**: When the session expires

### Session Object Structure

When a user successfully signs in via `supabase.auth.signInWithPassword()`, Supabase returns a session object like this:

```typescript
// Response from supabase.auth.signInWithPassword()
{
  data: {
    user: { /* user object */ },
    session: {
      access_token: "eyJhbGciOiJIUzI1NiIs...", // JWT token
      token_type: "bearer",
      expires_in: 3600,
      expires_at: 1754002596,
      refresh_token: "c7ixnp5sby42",
      user: { /* user object */ }
    }
  },
  error: null
}
```

### Real Session Example (from localStorage)

Here's what an actual session object looks like when stored in the browser's localStorage:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsImtpZCI6IkFsbHZvMFplTEtLTG5FVlciLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2Z2Z2tqdG9veWx3anVqcHVnbWttLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlM2Q0YmQxYS01NzczLTRkMjUtOWQwMS04N2Y1Yjk4NTQzMTUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU0MDAyNTk2LCJpYXQiOjE3NTM5OTg5OTYsImVtYWlsIjoiYUBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiYUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiJlM2Q0YmQxYS01NzczLTRkMjUtOWQwMS04N2Y1Yjk4NTQzMTUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc1Mzk5ODk5Nn1dLCJzZXNzaW9uX2lkIjoiYjc4NjI3NjctODM4OS00NjhmLWJhOGYtNTQ5NmU3ZDc0NjAxIiwiaXNfYW5vbnltb3VzIjpmYWxzZX0.ljaLnyJ_snO5DR9VJ4tTZ3iG_QAufW0fzUr227pwqpY",
  "token_type": "bearer",
  "expires_in": 3600,
  "expires_at": 1754002596,
  "refresh_token": "c7ixnp5sby42",
  "user": {
    "id": "e3d4bd1a-5773-4d25-9d01-87f5b9854315",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "a@gmail.com",
    "email_confirmed_at": "2025-07-29T19:04:25.526198Z",
    "phone": "",
    "confirmed_at": "2025-07-29T19:04:25.526198Z",
    "last_sign_in_at": "2025-07-31T21:56:36.45361348Z",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "email": "a@gmail.com",
      "email_verified": true,
      "phone_verified": false,
      "sub": "e3d4bd1a-5773-4d25-9d01-87f5b9854315"
    },
    "identities": [
      {
        "identity_id": "2e8206ce-9da8-4d80-b123-947ca77012e2",
        "id": "e3d4bd1a-5773-4d25-9d01-87f5b9854315",
        "user_id": "e3d4bd1a-5773-4d25-9d01-87f5b9854315",
        "identity_data": {
          "email": "a@gmail.com",
          "email_verified": false,
          "phone_verified": false,
          "sub": "e3d4bd1a-5773-4d25-9d01-87f5b9854315"
        },
        "provider": "email",
        "last_sign_in_at": "2025-07-29T19:04:25.520482Z",
        "created_at": "2025-07-29T19:04:25.520534Z",
        "updated_at": "2025-07-29T19:04:25.520534Z",
        "email": "a@gmail.com"
      }
    ],
    "created_at": "2025-07-29T19:04:25.508469Z",
    "updated_at": "2025-07-31T21:56:36.458485Z",
    "is_anonymous": false
  }
}
```

### Breaking Down the Session Components

#### 1. Access Token (JWT)
```
"access_token": "eyJhbGciOiJIUzI1NiIs..."
```
- **Format**: JSON Web Token (JWT) with three base64-encoded parts separated by dots
- **Structure**: `header.payload.signature`
- **Purpose**: Authenticates API requests to Supabase
- **Expiration**: Typically 1 hour (3600 seconds)
- **Usage**: Sent as `Authorization: Bearer <access_token>` header

#### 2. Refresh Token
```
"refresh_token": "c7ixnp5sby42"
```
- **Format**: Short, opaque string
- **Purpose**: Used to obtain new access tokens when they expire
- **Lifespan**: Longer than access tokens (typically days/weeks)
- **Security**: Should be stored securely and never exposed in URLs

#### 3. Expiration Information
```json
{
  "expires_in": 3600,        // Seconds until expiration
  "expires_at": 1754002596   // Unix timestamp of expiration
}
```

#### 4. User Object
Contains complete user information including:
- **Basic Info**: `id`, `email`, `role`
- **Metadata**: Custom user data and app-specific metadata
- **Authentication Details**: Sign-in history, providers used
- **Verification Status**: Email/phone confirmation status

### How Sessions Work in Different Contexts

#### Client-Side (Browser)
```typescript
// Getting the session from localStorage
const { data: { session } } = await supabase.auth.getSession();

if (session) {
  console.log('User ID:', session.user.id);
  console.log('Access Token:', session.access_token);
  console.log('Expires at:', new Date(session.expires_at * 1000));
}
```

#### Server-Side (API Routes)
```typescript
// Session is NOT automatically available
// Must be passed explicitly via headers or cookies
const authHeader = req.headers.get("authorization");
const token = authHeader?.replace("Bearer ", "");

// Token is just the access_token part of the session
console.log('Received token:', token);
// "eyJhbGciOiJIUzI1NiIs..."
```

### Key Insights

1. **Client vs Server**: Clients have the full session object; servers typically only receive the access token
2. **Token Expiration**: Access tokens expire quickly (1 hour), requiring refresh or re-authentication
3. **JWT Content**: The access token contains user claims (id, email, role) that can be decoded
4. **Security**: Never expose tokens in console.log, URLs, or client-side code in production

This session structure is what enables all the authentication patterns discussed below.

## Authentication Pattern Comparison

| Aspect | Method 1: Header + Admin | Method 2: Global Headers | Method 3: Cookies |
|--------|-------------------------|-------------------------|------------------|
| **Complexity** | Moderate | Simple | Moderate |
| **Security** | High (admin bypass) | Medium (user context) | High (httpOnly) |
| **RLS Compliance** | No (admin bypasses) | Yes (user enforced) | Yes (user enforced) |
| **Implementation** | Two clients needed | Single client | Single client |

---

## Method 1: Authorization Header + Admin Client (Current Implementation)

**Your current approach - most commonly used but bypasses RLS policies**

### How it works:
1. **Frontend**: Pass the session access_token as Authorization Bearer header
2. **Backend**: Create anon client, validate user with `getUser(token)`
3. **Backend**: Create separate admin client (service role) for database/storage operations

### Code Examples from Your Project:

#### Frontend - Sending Request with Auth Header
```typescript
// components/ui/CVGenerationModal.tsx (lines 107-119)
const generatePDF = async (improvedCVData: any) => {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  const pdfResponse = await fetch("/api/cv/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Pass the authorization header
      ...(session?.access_token && {
        "Authorization": `Bearer ${session.access_token}`
      })
    },
    body: JSON.stringify({ cvData: improvedCVData }),
  });
};
```

#### Backend - Authentication Validation
```typescript
// app/api/cv/generate/route.ts (lines 15-28)
export async function POST(req: NextRequest) {
  // Get current user using authorization header
  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
    }
    
    // User is authenticated, proceed with operations...
  }
}
```

#### Backend - Using Admin Client for Storage Operations
```typescript
// lib/supabase/server.ts (lines 8-31)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Upload using admin client (bypasses RLS)
export const uploadPdfToStorageAdmin = async (filePath: string, file: Buffer) => {
  const { data, error } = await supabase.storage  // Using admin client
    .from('cv-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    })
  // ...
}
```

### Pros:
- ✅ Simple to implement
- ✅ Guaranteed access to all operations
- ✅ No RLS complexity for admin operations

### Cons:
- ❌ **Bypasses RLS policies** - admin client has god-mode access
- ❌ Requires two separate Supabase clients
- ❌ No audit trail of which user performed operations
- ❌ Security risk if admin credentials are compromised

---

## Method 2: Global Headers Injection (Recommended)

**Single client with user context - RLS friendly approach**

### How it works:
1. **Frontend**: Same - pass access_token as Authorization Bearer header
2. **Backend**: Create single anon client with global headers containing user JWT
3. **Backend**: All operations use the same client with user context

### Recommended Implementation:
```typescript
// app/api/cv/generate/route.ts - Enhanced Version
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  
  // Create client with user context in global headers
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  // Validate user (optional - headers already set)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Now all operations use the authenticated user context
  // Upload to storage (with RLS enforced)
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('cv-files')
    .upload(filePath, fileBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    });

  // Insert to database (with RLS enforced)
  const { data: resumeData, error: dbError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      title: filename,
      file_path: uploadData.path
    })
    .select()
    .single();

  return NextResponse.json({ success: true, resume: resumeData });
}
```

### Helper Function for Authenticated Supabase Client:
```typescript
// lib/supabase/authenticated-server.ts
import { createClient } from '@supabase/supabase-js';

export const createAuthenticatedServerClient = (token: string) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );
};

// Usage in API routes:
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createAuthenticatedServerClient(token);
  
  // All operations now have user context
  // ...
}
```

### Pros:
- ✅ **RLS policies enforced** - operations run in user context
- ✅ Single Supabase client needed
- ✅ Proper audit trail (operations tied to actual user)
- ✅ Better security posture
- ✅ Cleaner code architecture

### Cons:
- ❌ Must ensure RLS policies are properly configured
- ❌ Potential for permission errors if RLS is too restrictive

---

## Method 3: Cookie-Based Authentication (Not Currently Implemented)

**Using HTTP-only cookies for JWT transport**

### How it works:
1. **Authentication**: Store JWT in HTTP-only cookie after login
2. **Frontend**: Cookies automatically sent with requests
3. **Backend**: Extract JWT from cookies, create authenticated client

### Implementation Example:

#### Setting Cookie After Login:
```typescript
// app/api/auth/login/route.ts
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Set HTTP-only cookie
  const response = NextResponse.json({ success: true, user: data.user });
  response.cookies.set('supabase-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: data.session.expires_in,
    path: '/'
  });

  return response;
}
```

#### Using Cookie in API Routes:
```typescript
// app/api/cv/generate/route.ts - Cookie Version
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('supabase-token')?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Create authenticated client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
  );

  // Validate and use...
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // All operations have user context
  // ...
}
```

#### Frontend - No Manual Header Management:
```typescript
// components/ui/CVGenerationModal.tsx - Cookie Version
const generatePDF = async (improvedCVData: any) => {
  // No need to manually set Authorization header
  const pdfResponse = await fetch("/api/cv/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include', // Important: include cookies
    body: JSON.stringify({ cvData: improvedCVData }),
  });
};
```

### Pros:
- ✅ **Automatic authentication** - no manual header management
- ✅ **HTTP-only cookies** - not accessible to JavaScript (XSS protection)
- ✅ **RLS policies enforced** - operations run in user context
- ✅ Works seamlessly with server-side rendering

### Cons:
- ❌ **CSRF vulnerability** - requires CSRF protection
- ❌ More complex cookie management (expiration, refresh)
- ❌ Not suitable for mobile apps or external API consumers

---

## Key Clarifications to Your Understanding

### ✅ Correct Understanding:
- Server-side has no persistent session context (unlike client-side localStorage)
- `supabase.auth.getUser(token)` only validates the token but doesn't modify the client's Authorization header
- Without explicit authentication, server requests are treated as anonymous

### 📝 Clarifications:
1. **Method 1 vs Method 2**: The key difference isn't just admin vs non-admin, but **RLS bypass vs RLS enforcement**
2. **Global Headers**: When you set global headers with JWT, ALL subsequent requests from that client instance carry the user's authentication
3. **Security Trade-offs**: Method 1 is easier but less secure; Method 2 is more secure but requires proper RLS setup

## Recommendations

### For Your Project:
1. **Short-term**: Continue with Method 1 but ensure admin operations are properly secured
2. **Medium-term**: Migrate to Method 2 for better security and RLS compliance
3. **Long-term**: Consider Method 3 for enhanced UX and security

### Best Practices:
- Always validate tokens on server-side
- Implement proper RLS policies before switching to Method 2
- Use TypeScript for better type safety
- Implement proper error handling and logging
- Consider token refresh mechanisms for long-lived sessions

### Migration Path from Method 1 to Method 2:
1. Audit and implement proper RLS policies
2. Create helper function for authenticated server client
3. Replace admin client calls with authenticated client calls
4. Test thoroughly with different user permissions
5. Remove admin client usage gradually

---

## Security Considerations

### Method 1 (Current):
- Admin key exposure risk
- No RLS audit trail
- Potential for data leaks

### Method 2 (Recommended):
- User-scoped operations
- RLS policy compliance
- Proper audit trails

### Method 3 (Cookies):
- CSRF protection required
- Secure cookie configuration
- Token refresh handling

Choose the method that best fits your security requirements and application architecture.