<template>
  <section class="pg-section">
    <div class="pg-inner">
      <div class="pg-header">
        <h2>Playground</h2>
        <p>Try PancakeSwap AI live — no setup required.</p>
      </div>
      <div class="pg-frame-wrap">
        <iframe
          src="http://167.172.74.177:888/"
          title="PancakeSwap AI Playground"
          allow="clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg-section {
  padding: 64px 24px;
}

.pg-inner {
  max-width: 1152px;
  margin: 0 auto;
}

.pg-header {
  text-align: center;
  margin-bottom: 32px;
}

.pg-header h2 {
  font-size: 28px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  margin: 0 0 8px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-tip-1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pg-header p {
  font-size: 15px;
  color: var(--vp-c-text-2);
  margin: 0;
}

.pg-frame-wrap {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  height: 680px;
}

.pg-frame-wrap iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

@media (max-width: 768px) {
  .pg-section {
    padding: 48px 20px;
  }

  .pg-frame-wrap {
    height: 500px;
  }
}
</style>
