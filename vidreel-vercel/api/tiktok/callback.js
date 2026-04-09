export default async function handler(req, res) {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(`TikTok auth error: ${error_description || error}`);
    }

    if (!code) {
      return res.status(400).send("Missing authorization code");
    }

    const cookie = req.headers.cookie || "";
    const savedState = cookie
      .split("; ")
      .find((row) => row.startsWith("tiktok_oauth_state="))
      ?.split("=")[1];

    if (!savedState || savedState !== state) {
      return res.status(400).send("Invalid state");
    }

    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: decodeURIComponent(code),
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    });

    const tokenResp = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body,
    });

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || tokenData.error) {
      return res.status(400).json({
        error: "token_exchange_failed",
        tiktok: tokenData,
      });
    }

    const redirectUrl = new URL(process.env.FRONTEND_URL);
    redirectUrl.searchParams.set("tt_access_token", tokenData.access_token || "");
    redirectUrl.searchParams.set("tt_open_id", tokenData.open_id || "");

    return res.redirect(redirectUrl.toString());
  } catch (err) {
    return res.status(500).json({ error: "internal_error", detail: err.message });
  }
}