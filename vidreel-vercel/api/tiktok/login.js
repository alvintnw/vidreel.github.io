export default async function handler(req, res) {
  try {
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      response_type: "code",
      scope: "user.info.basic",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      state,
    });

    res.setHeader(
      "Set-Cookie",
      `tiktok_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
    return res.redirect(authUrl);
  } catch (err) {
    return res.status(500).json({ error: "failed_to_start_oauth", detail: err.message });
  }
}