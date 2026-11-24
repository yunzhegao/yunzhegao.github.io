(() => {
  const endpoint = "https://yunzhegao-site-visits.usmarketmonitor.workers.dev/visits";
  if (!endpoint || location.origin !== "https://yunzhegao.github.io") return;

  const panel = document.querySelector("[data-site-visits]");
  const requestOptions = { credentials: "omit", referrerPolicy: "no-referrer" };
  let mapCenters;

  function positionTooltip(map, marker, label) {
    const tooltip = map.querySelector("[data-visit-tooltip]");
    if (!marker) {
      tooltip.hidden = true;
      return;
    }

    tooltip.textContent = label;
    tooltip.hidden = false;
    const left = marker.offsetLeft - tooltip.offsetWidth / 2;
    tooltip.style.left = `${Math.max(0, Math.min(left, map.clientWidth - tooltip.offsetWidth))}px`;

    const gap = 9;
    const above = marker.offsetTop - tooltip.offsetHeight - gap;
    tooltip.style.top = `${above >= 0 ? above : marker.offsetTop + gap}px`;
  }

  async function showMap(areas, isChinese) {
    const map = panel.querySelector("[data-visit-map]");
    const pins = map.querySelector("[data-visit-pins]");
    try {
      mapCenters ??= await fetch("/assets/site-visits-centers.json?v=1").then((response) => {
        if (!response.ok) throw new Error("Map coordinates unavailable");
        return response.json();
      });
    } catch {
      return;
    }

    const visibleAreas = areas.flatMap((area) => {
      const center = mapCenters[area.code];
      if (!center || area.views <= 0) return [];
      const [latitude, longitude] = center;

      // Match the latitude scale and horizontal compression of the Market outline.
      const x = 50 + longitude * (0.21 + 0.0665 * Math.cos(latitude * Math.PI / 180));
      const y = 55.94 - 0.614 * latitude;
      return y > 0 && y < 100 ? [{ ...area, x, y }] : [];
    });
    const maxViews = Math.max(1, ...visibleAreas.map((area) => area.views));
    const maxLog = Math.log(maxViews);
    let selected;
    positionTooltip(map);

    const markers = visibleAreas.map(({ name, views, formattedViews, x, y }) => {
      const scale = maxLog ? Math.log(views) / maxLog : 1;
      const diameter = 5 + 11 * scale;
      const marker = document.createElement("button");
      const label = isChinese
        ? `${name} · ${formattedViews} 次浏览`
        : `${name} · ${formattedViews} ${views === 1 ? "page view" : "page views"}`;
      marker.type = "button";
      marker.className = "button-reset footer-visit-pin";
      marker.setAttribute("aria-label", label);
      marker.style.setProperty("--pin-x", `${x}%`);
      marker.style.setProperty("--pin-y", `${y}%`);
      marker.style.setProperty("--pin-size", `${diameter}px`);

      const show = () => positionTooltip(map, marker, label);
      const restore = () => positionTooltip(map, selected, selected?.getAttribute("aria-label"));
      marker.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch") show();
      });
      marker.addEventListener("pointerleave", () => {
        if (document.activeElement !== marker) restore();
      });
      marker.addEventListener("focus", show);
      marker.addEventListener("blur", restore);
      marker.addEventListener("click", () => {
        selected = selected === marker ? undefined : marker;
        restore();
      });
      return marker;
    });
    pins.replaceChildren(...markers);
    map.onkeydown = (event) => {
      if (event.key === "Escape") {
        selected = undefined;
        positionTooltip(map);
      }
    };
    map.onclick = (event) => {
      if (pins.contains(event.target)) return;
      selected = undefined;
      positionTooltip(map);
    };
  }

  async function showStatistics() {
    const status = panel.querySelector("[data-visit-status]");
    const language = document.documentElement.lang;
    const isChinese = language.startsWith("zh");

    try {
      const response = await fetch(endpoint, requestOptions);
      if (!response.ok) throw new Error("Statistics unavailable");
      const { total, since, countries } = await response.json();
      if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(countries)) {
        throw new Error("Invalid statistics");
      }

      const numbers = new Intl.NumberFormat(language);
      const date = since ? new Date(since) : null;
      const sinceLabel = panel.querySelector("[data-visit-since]");
      if (date) {
        const time = sinceLabel.querySelector("time");
        time.dateTime = date.toISOString();
        time.textContent = new Intl.DateTimeFormat(language, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Singapore",
        }).format(date) + " (GMT+8)";
      }
      sinceLabel.hidden = !date;

      const regions = typeof Intl.DisplayNames === "function"
        ? new Intl.DisplayNames([language], { type: "region" })
        : null;
      const areas = countries.map(({ code, views }) => ({
        code,
        views,
        formattedViews: numbers.format(views),
        name: code === "XX"
          ? (isChinese ? "未知" : "Unknown")
          : (regions?.of(code) ?? code),
      }));
      const rows = areas.map(({ name, formattedViews }) => {
        const row = document.createElement("tr");
        row.insertCell().textContent = name;
        row.insertCell().textContent = formattedViews;
        return row;
      });
      panel.querySelector("tbody").replaceChildren(...rows);
      panel.querySelector("[data-visit-count]").textContent = numbers.format(total);
      panel.querySelector("[data-visit-total]").hidden = false;
      panel.querySelector("[data-visit-breakdown]").hidden = rows.length === 0;
      status.hidden = true;
      await showMap(areas, isChinese);
    } catch {
      status.textContent = isChinese ? "访问统计暂时无法加载" : "Visit statistics are temporarily unavailable";
      status.hidden = false;
    }
  }

  async function recordPageView() {
    if (panel) panel.hidden = false;
    try {
      await fetch(endpoint, { ...requestOptions, method: "POST", keepalive: true });
    } catch {
      // A blocked report can still leave the read-only statistics accessible.
    }
    if (panel) await showStatistics();
  }

  if (document.prerendering) {
    document.addEventListener("prerenderingchange", recordPageView, { once: true });
  } else {
    recordPageView();
  }

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) recordPageView();
  });
})();
