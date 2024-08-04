export async function request(url: string) {
  const perfix = "http-cache";
  const key = `${perfix}-${url}`;

  try {
    const value = JSON.parse(localStorage.getItem(key) || "");

    if (Number(value.expire_time) > new Date().getTime()) {
      return value.data;
    }
  } catch (error) {
    // ignore
  }

  try {
    const resp = await fetch(url, { method: "Get" });
    const data = await resp.json();

    localStorage.setItem(
      key,
      JSON.stringify({
        expire_time: new Date().getTime() + 1000 * 60 * 60 * 24,
        data,
      })
    );

    return data;
  } catch (error) {
    console.log("request error", error);
  }
}
