import React, { useRef, useState } from 'react';

export default function ImageUpload({ existing = [], onExistingChange, onNewFiles }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]); /* new file previews */
  const [dragging, setDragging] = useState(false);

  function addFiles(files) {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    setPreviews(prev => [...prev, ...valid.map(f => ({ url: URL.createObjectURL(f), file: f }))]);
    onNewFiles(prev => [...prev, ...valid]);
  }

  function removeExisting(url) {
    onExistingChange(prev => prev.filter(u => u !== url));
  }
  function removeNew(idx) {
    setPreviews(prev => { const n = [...prev]; n.splice(idx,1); return n; });
    onNewFiles(prev => { const n = [...prev]; n.splice(idx,1); return n; });
  }

  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const totalCount = existing.length + previews.length;

  return (
    <div>
      {/* drop zone */}
      <div
        style={{
          ...dropZone,
          borderColor: dragging ? '#D4B97A' : 'rgba(212,185,122,.2)',
          background: dragging ? 'rgba(212,185,122,.05)' : '#0B1320'
        }}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div style={{ fontSize: 32 }}>📷</div>
        <div style={{ fontSize: 13, color: '#9A9486' }}>
          Zvarrit &amp; lësho fotot, ose kliko për të zgjedhur
        </div>
        <div style={{ fontSize: 11, color: '#9A9486' }}>JPG, PNG, WEBP — max 10MB secila</div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* image grid */}
      {totalCount > 0 && (
        <div style={grid}>
          {/* existing */}
          {existing.map(url => (
            <div key={url} style={thumb}>
              <img src={url} alt="" style={thumbImg} />
              <button style={removeBtn} onClick={() => removeExisting(url)} type="button" title="Remove">✕</button>
              <span style={thumbLabel}>ruajtur</span>
            </div>
          ))}
          {/* new */}
          {previews.map((p, i) => (
            <div key={i} style={thumb}>
              <img src={p.url} alt="" style={thumbImg} />
              <button style={removeBtn} onClick={() => removeNew(i)} type="button" title="Remove">✕</button>
              <span style={{ ...thumbLabel, background: 'rgba(212,185,122,.2)', color: '#D4B97A' }}>e re</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const dropZone = {
  border: '2px dashed', borderRadius: 10, padding: '32px 24px',
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  cursor: 'pointer', transition: 'all .2s', userSelect: 'none'
};
const grid = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px,1fr))',
  gap: 10, marginTop: 16
};
const thumb = {
  position: 'relative', borderRadius: 8, overflow: 'hidden',
  aspectRatio: '4/3', background: '#0B1320',
  border: '1px solid rgba(212,185,122,.1)'
};
const thumbImg = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };
const removeBtn = {
  position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.7)',
  border: 'none', borderRadius: '50%', width: 22, height: 22,
  color: '#fff', fontSize: 11, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const thumbLabel = {
  position: 'absolute', bottom: 4, left: 4, fontSize: 10,
  background: 'rgba(0,0,0,.6)', color: '#9A9486',
  padding: '2px 6px', borderRadius: 4
};
