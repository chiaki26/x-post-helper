const CHAR_LIMIT = 280;

const form = document.getElementById('post-form');
const resultsSection = document.getElementById('results');
const resultsList = document.getElementById('results-list');
const priceLabelEl = document.getElementById('price-label');
const urlCallout = document.getElementById('url-callout');
const urlCalloutText = document.getElementById('url-callout-text');
const urlCopyBtn = document.getElementById('url-copy-btn');

form.querySelectorAll('input[name="category"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    priceLabelEl.textContent = radio.value === 'event' && radio.checked ? '参加費' : '価格';
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = collectFormData();
  if (!data.name) return;
  const posts = buildPosts(data);
  renderResults(posts, data.url);
});

function collectFormData() {
  const category = form.querySelector('input[name="category"]:checked').value;
  const name = document.getElementById('item-name').value.trim();
  const features = document.getElementById('features').value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  const price = document.getElementById('price').value.trim();
  const datetime = document.getElementById('datetime').value.trim();
  const place = document.getElementById('place').value.trim();
  const tags = document.getElementById('hashtags').value
    .split(/\s+/)
    .map((s) => s.replace(/^#/, '').trim())
    .filter(Boolean);
  const url = document.getElementById('url').value.trim();
  return { category, name, features, price, datetime, place, tags, url };
}

function buildPosts(data) {
  const words = data.category === 'event'
    ? { verb: '開催', priceLabel: '参加費', dateWord: '日時', ctaA: '気になった人はぜひ足を運んでみてください', ctaB: '見逃すと後悔するかもしれません', ctaC: '数量限定・なくなり次第終了です', ctaD: 'あなたの参加をお待ちしています' }
    : { verb: '入荷', priceLabel: '価格', dateWord: '発売', ctaA: '気になった人はチェックしてみてください', ctaB: '見逃すと後悔するかもしれません', ctaC: '数量限定なのでお早めに', ctaD: '気になる方はプロフィールからチェック' };

  const l = {
    name: data.name,
    feat1: data.features[0] || '',
    feat2: data.features[1] || '',
    feat3: data.features[2] || '',
    price: data.price,
    datetime: data.datetime,
    place: data.place,
    tagsLine: data.tags.map((t) => `#${t}`).join(' ')
  };

  const tagLine = () => (l.tagsLine ? { text: l.tagsLine, priority: 1 } : null);
  const priceLine = () => (l.price ? `${words.priceLabel}:${l.price}` : null);
  const dateLine = () => (l.datetime ? `${words.dateWord}:${l.datetime}` : null);
  const placeLine = () => (l.place ? { text: `📍${l.place}`, priority: 4 } : null);
  const featureCount = [l.feat1, l.feat2, l.feat3].filter(Boolean).length;

  const templates = [
    {
      label: '質問投げかけ型',
      lines: [
        `${l.name}、もう知ってる?`,
        '',
        l.feat1 || null,
        priceLine(),
        dateLine(),
        placeLine(),
        '',
        words.ctaA,
        tagLine()
      ]
    },
    {
      label: '驚き型',
      lines: [
        data.category === 'event' ? `${l.name}、まさかの内容です。` : `${l.name}、正直ここまでとは思いませんでした。`,
        '',
        l.feat1 || null,
        l.feat2 ? { text: l.feat2, priority: 3 } : null,
        priceLine(),
        dateLine(),
        '',
        words.ctaB,
        tagLine()
      ]
    },
    {
      label: '限定・緊急型',
      lines: [
        l.datetime ? `【${l.datetime}】` : `【${words.verb}情報】`,
        l.name,
        '',
        l.feat1 || null,
        priceLine(),
        placeLine(),
        '',
        words.ctaC,
        tagLine()
      ]
    },
    featureCount > 0 && {
      label: '箇条書きリスト型',
      lines: [
        `${l.name}のポイントはこの${featureCount}つ`,
        '',
        l.feat1 ? `① ${l.feat1}` : null,
        l.feat2 ? { text: `② ${l.feat2}`, priority: 3 } : null,
        l.feat3 ? { text: `③ ${l.feat3}`, priority: 2 } : null,
        priceLine(),
        dateLine(),
        tagLine()
      ]
    },
    {
      label: '共感・呼びかけ型',
      lines: [
        data.category === 'event' ? `こんな${l.name}、待ってませんでしたか?` : `こんな${l.name}を探していませんでしたか?`,
        '',
        l.feat1 || null,
        l.feat2 ? { text: l.feat2, priority: 3 } : null,
        priceLine(),
        dateLine(),
        placeLine(),
        '',
        words.ctaD,
        tagLine()
      ]
    }
  ].filter(Boolean);

  return templates.map((t) => ({
    label: t.label,
    text: trimToLimit(t.lines)
  }));
}

function trimToLimit(lineItems, limit = CHAR_LIMIT) {
  let lines = lineItems.filter((l) => l !== null && l !== undefined);

  const render = () => lines.map((l) => (typeof l === 'string' ? l : l.text)).join('\n');

  let text = render();
  while (text.length > limit) {
    let dropIndex = -1;
    let lowestPriority = Infinity;
    lines.forEach((l, i) => {
      if (typeof l === 'object' && typeof l.priority === 'number' && l.priority < lowestPriority) {
        lowestPriority = l.priority;
        dropIndex = i;
      }
    });
    if (dropIndex === -1) break;
    lines.splice(dropIndex, 1);
    text = render();
  }

  if (text.length > limit) {
    text = text.slice(0, limit - 1) + '…';
  }
  return text;
}

function renderResults(posts, url) {
  if (url) {
    urlCalloutText.textContent = url;
    urlCallout.hidden = false;
  } else {
    urlCallout.hidden = true;
  }

  resultsList.innerHTML = '';
  posts.forEach((post, i) => {
    const card = document.createElement('div');
    card.className = 'post-card';

    const label = document.createElement('div');
    label.className = 'post-card-label';
    label.textContent = post.label;

    const text = document.createElement('p');
    text.className = 'post-card-text';
    text.textContent = post.text;

    const footer = document.createElement('div');
    footer.className = 'post-card-footer';

    const count = document.createElement('span');
    count.className = 'char-count' + (post.text.length > CHAR_LIMIT * 0.9 ? ' warn' : '');
    count.textContent = `${post.text.length} / ${CHAR_LIMIT}`;

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'コピー';
    copyBtn.addEventListener('click', () => copyText(post.text, copyBtn));

    footer.appendChild(count);
    footer.appendChild(copyBtn);
    card.appendChild(label);
    card.appendChild(text);
    card.appendChild(footer);
    resultsList.appendChild(card);
  });

  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyText(text, btn) {
  const done = () => {
    const original = 'コピー';
    btn.textContent = 'コピーしました';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  };

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}

function fallbackCopy(text, done) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
    done();
  } finally {
    document.body.removeChild(textarea);
  }
}

urlCopyBtn.addEventListener('click', () => copyText(urlCalloutText.textContent, urlCopyBtn));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}
