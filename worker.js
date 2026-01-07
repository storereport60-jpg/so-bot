export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith("/api/")) {
      return new Response("Forbidden", { status: 403 });
    }

    const token = request.headers.get("x-auth-token");
    if (token !== env.SECRET_TOKEN) {
      return new Response("Unauthorized", { status: 401 });
    }

    const BASE = "https://app.alfastore.co.id/prd/api/rpt/";

    const MAP = {
      last: "laporan_so/csel_last_so_absolute_desc",
      adjust: "laporan_so/csel_all_so_absolute_desc",
      daily: "laporan/daily_performance",
      notmain: "laporan/laporan_plu_tak_main_toko",
      disc: "laporan/rpt_plu_discontinue",
      lap2324: "laporan/rep_gabungan_23_24"
    };

    const key = url.pathname.replace("/api/","");
    if(!MAP[key]) return new Response("Invalid route",{status:400});

    const target = BASE + MAP[key] + "?" + url.searchParams.toString();

    const res = await fetch(target,{
      headers:{ "User-Agent":"Mozilla/5.0" }
    });

    return new Response(res.body,{
      status:res.status,
      headers:{
        "Content-Type":res.headers.get("Content-Type"),
        "Cache-Control":"no-store"
      }
    });
  }
};
