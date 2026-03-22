(function () {
  function cancelAnimation(canvas) {
    if (!canvas || !canvas.dataset.rafId) return;
    window.cancelAnimationFrame(Number(canvas.dataset.rafId));
    delete canvas.dataset.rafId;
  }

  function prefersReducedMotion() {
    return typeof window !== "undefined"
      && window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function easeOutCubic(value) {
    const clamped = Math.max(0, Math.min(1, value));
    return 1 - Math.pow(1 - clamped, 3);
  }

  function toRgba(color, alpha) {
    if (typeof color !== "string") return `rgba(76, 201, 240, ${alpha})`;
    if (color.startsWith("#")) {
      const normalized = color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
      const int = Number.parseInt(normalized.slice(1), 16);
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color.startsWith("rgb(")
      ? color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`)
      : color;
  }

  function drawChartFrame(ctx, width, height, padding, yFormatter, maxValue) {
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createLinearGradient(0, 0, 0, height);
    background.addColorStop(0, "#0d1629");
    background.addColorStop(1, "#070d18");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#26354a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const y = padding + ((height - padding * 2) * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#9fb3ca";
    ctx.font = "12px sans-serif";
    ctx.fillText(yFormatter(maxValue), 6, padding + 4);
    ctx.fillText(yFormatter(maxValue / 2), 6, height / 2 + 4);
    ctx.fillText(yFormatter(0), 6, height - padding + 4);
  }

  function animate(canvas, draw) {
    cancelAnimation(canvas);
    if (prefersReducedMotion()) {
      draw(1);
      return;
    }

    const durationMs = 650;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / durationMs);
      draw(easeOutCubic(progress));
      if (progress < 1) {
        canvas.dataset.rafId = String(window.requestAnimationFrame(tick));
      } else {
        delete canvas.dataset.rafId;
      }
    }

    canvas.dataset.rafId = String(window.requestAnimationFrame(tick));
  }

  function drawLineChart(canvas, values, options) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const color = (options && options.color) || "#4cc9f0";
    const yFormatter = (options && options.yFormatter) || ((v) => String(Math.round(v)));
    const maxValue = Math.max(1, ...values, 0);
    const xStep = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

    function draw(progress) {
      drawChartFrame(ctx, width, height, padding, yFormatter, maxValue);

      if (!values.length) return;

      const visibleCount = Math.max(1, Math.ceil(values.length * progress));
      const visibleValues = values.slice(0, visibleCount);

      const stroke = ctx.createLinearGradient(0, padding, width, height - padding);
      stroke.addColorStop(0, color);
      stroke.addColorStop(1, "rgba(255,255,255,0.85)");
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      visibleValues.forEach((value, idx) => {
        const x = padding + idx * xStep;
        const y = height - padding - (value / maxValue) * (height - padding * 2);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();

      if (visibleValues.length > 1) {
        const area = ctx.createLinearGradient(0, padding, 0, height - padding);
        area.addColorStop(0, toRgba(color, 0.24));
        area.addColorStop(1, "rgba(255,255,255,0)");
        ctx.lineTo(padding + (visibleValues.length - 1) * xStep, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        ctx.fillStyle = area;
        ctx.fill();
      }

      const lastIndex = visibleValues.length - 1;
      const lastValue = visibleValues[lastIndex];
      const dotX = padding + lastIndex * xStep;
      const dotY = height - padding - (lastValue / maxValue) * (height - padding * 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    animate(canvas, draw);
  }

  function drawBarChart(canvas, values, options) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;
    const color = (options && options.color) || "#2aa889";
    const maxValue = Math.max(1, ...values, 0);
    const barWidth = values.length ? (width - padding * 2) / values.length : 0;

    function draw(progress) {
      drawChartFrame(ctx, width, height, padding, function (value) {
        return String(Math.round(value));
      }, maxValue);

      if (!values.length) return;

      values.forEach((value, idx) => {
        const barHeight = (value / maxValue) * (height - padding * 2) * progress;
        const x = padding + idx * barWidth + 1;
        const y = height - padding - barHeight;
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "rgba(255,255,255,0.2)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, Math.max(1, barWidth - 3), barHeight);
      });
    }

    animate(canvas, draw);
  }

  window.TypingSchool = window.TypingSchool || {};
  window.TypingSchool.ChartRenderer = {
    drawLineChart,
    drawBarChart
  };
})();
