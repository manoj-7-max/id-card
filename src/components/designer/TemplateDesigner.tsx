import { useEffect, useMemo, useState } from 'react';
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceAround,
  AlignStartHorizontal,
  AlignStartVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Image,
  Layers,
  Lock,
  Minus,
  QrCode,
  RectangleHorizontal,
  RotateCcw,
  Settings,
  Trash2,
  Type,
  Unlock,
  Upload,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import type { CanvasElement, CanvasElementType } from '../../types';

function makeElement(type: CanvasElementType): CanvasElement {
  const id = crypto.randomUUID();
  const base = {
    id,
    type,
    name: `${type} element`,
    x: 120,
    y: 120,
    width: type === 'line' ? 240 : 220,
    height: type === 'line' ? 2 : 90,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
  };
  if (type === 'text') return { ...base, text: '{{Name}}', fontSize: 32, fontFamily: 'Noto Sans', fontWeight: '700', fill: '#0f172a' };
  if (type === 'photo') return { ...base, width: 210, height: 260, cornerRadius: 18, borderWidth: 6, borderColor: '#ffffff' };
  if (type === 'qrcode') return { ...base, width: 130, height: 130, dataField: 'StudentID', qrDataType: 'json' };
  if (type === 'barcode') return { ...base, width: 360, height: 110, dataField: 'StudentID', barcodeFormat: 'CODE128' };
  if (type === 'line') return { ...base, points: [0, 0, 240, 0], stroke: '#155e75', strokeWidth: 4 };
  return { ...base, shapeType: 'rect', backgroundColor: '#155e75', cornerRadius: 12 };
}

export default function TemplateDesigner() {
  const { state, dispatch } = useApp();
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'layers'>('properties');
  const template = state.activeTemplate;
  const elements = useMemo(
    () => (state.activeCardSide === 'front' ? template?.frontElements : template?.backElements) || [],
    [template, state.activeCardSide]
  );
  const selected = elements.find((element) => element.id === state.selectedElementId) || null;

  if (!template) {
    return <div className="empty-state"><div className="empty-state-title">Create or select a template to start designing.</div></div>;
  }

  const updateElements = (next: CanvasElement[]) => {
    dispatch({
      type: 'UPDATE_ACTIVE_TEMPLATE',
      payload:
        state.activeCardSide === 'front'
          ? { frontElements: next, updatedAt: new Date().toISOString() }
          : { backElements: next, updatedAt: new Date().toISOString() },
    });
  };

  const patchElement = (id: string, patch: Partial<CanvasElement>) => {
    updateElements(elements.map((element) => (element.id === id ? { ...element, ...patch } : element)));
  };

  const addElement = (type: CanvasElementType) => {
    const element = makeElement(type);
    updateElements([...elements, element]);
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element.id });
  };

  const deleteSelected = () => {
    if (!selected) return;
    updateElements(elements.filter((element) => element.id !== selected.id));
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: null });
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected, id: crypto.randomUUID(), name: `${selected.name} copy`, x: selected.x + 24, y: selected.y + 24 };
    updateElements([...elements, copy]);
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: copy.id });
  };

  const addStaticImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const element = makeElement('image');
        element.src = ev.target?.result as string;
        element.name = 'Static Image';
        updateElements([...elements, element]);
        dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element.id });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const reorderLayer = (id: string, direction: 'up' | 'down') => {
    const idx = elements.findIndex(e => e.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx < elements.length - 1) {
      const next = [...elements];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      updateElements(next);
    } else if (direction === 'down' && idx > 0) {
      const next = [...elements];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      updateElements(next);
    }
  };

  const alignSelected = (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selected || !template) return;
    let patch: Partial<CanvasElement> = {};
    if (align === 'left') patch.x = 0;
    if (align === 'center') patch.x = (template.canvasWidth - selected.width) / 2;
    if (align === 'right') patch.x = template.canvasWidth - selected.width;
    if (align === 'top') patch.y = 0;
    if (align === 'middle') patch.y = (template.canvasHeight - selected.height) / 2;
    if (align === 'bottom') patch.y = template.canvasHeight - selected.height;
    patchElement(selected.id, patch);
  };

  return (
    <div className="designer-shell">
      <div className="designer-toolbar glass-card-static">
        <button className="tool-btn" title="Add text" onClick={() => addElement('text')}><Type size={18} /></button>
        <button className="tool-btn" title="Add dynamic photo" onClick={() => addElement('photo')}><Image size={18} /></button>
        <button className="tool-btn" title="Upload static image" onClick={addStaticImage}><Upload size={18} /></button>
        <button className="tool-btn" title="Add QR code" onClick={() => addElement('qrcode')}><QrCode size={18} /></button>
        <button className="tool-btn" title="Add barcode" onClick={() => addElement('barcode')}><RectangleHorizontal size={18} /></button>
        <button className="tool-btn" title="Add shape" onClick={() => addElement('shape')}><RectangleHorizontal size={18} /></button>
        <button className="tool-btn" title="Add line" onClick={() => addElement('line')}><Minus size={18} /></button>
        <span className="toolbar-divider" />
        <button className="tool-btn" title="Duplicate" onClick={duplicateSelected}><Copy size={18} /></button>
        <button className="tool-btn" title="Reset rotation" onClick={() => selected && patchElement(selected.id, { rotation: 0 })}><RotateCcw size={18} /></button>
        <button className="tool-btn danger" title="Delete" onClick={deleteSelected}><Trash2 size={18} /></button>
      </div>

      <div className="designer-workbench">
        <div className="canvas-wrap">
          <Stage width={template.canvasWidth * 0.62} height={template.canvasHeight * 0.62} scaleX={0.62} scaleY={0.62}>
            <Layer>
              <Rect width={template.canvasWidth} height={template.canvasHeight} fill={template.backgroundColor} shadowBlur={16} shadowColor="rgba(0,0,0,0.24)" />
              {template.backgroundImage && <BackgroundImageNode src={template.backgroundImage} width={template.canvasWidth} height={template.canvasHeight} />}
              {elements.map((element) => {
                if (!element.visible) return null;
                return (
                  <EditableElement
                    key={element.id}
                    element={element}
                    selected={element.id === state.selectedElementId}
                    onSelect={() => dispatch({ type: 'SET_SELECTED_ELEMENT', payload: element.id })}
                    onChange={(patch) => patchElement(element.id, patch)}
                    onEdit={() => setEditingTextId(element.id)}
                  />
                );
              })}
            </Layer>
          </Stage>
          {editingTextId && (() => {
            const el = elements.find(e => e.id === editingTextId);
            if (!el) return null;
            return (
              <textarea
                autoFocus
                value={el.text || ''}
                onChange={(e) => patchElement(el.id, { text: e.target.value })}
                onBlur={() => setEditingTextId(null)}
                style={{
                  position: 'absolute',
                  top: el.y * 0.62,
                  left: el.x * 0.62,
                  width: el.width * 0.62,
                  height: Math.max(el.height * 0.62, 50),
                  fontSize: (el.fontSize || 24) * 0.62,
                  fontFamily: el.fontFamily,
                  fontWeight: el.fontWeight,
                  color: el.fill,
                  textAlign: el.align as any,
                  background: 'transparent',
                  border: '2px dashed #3b82f6',
                  outline: 'none',
                  resize: 'none',
                  padding: 0,
                  margin: 0,
                  lineHeight: el.lineHeight || 1.2,
                  zIndex: 10,
                  transform: `rotate(${el.rotation}deg)`,
                  transformOrigin: 'top left'
                }}
              />
            );
          })()}
        </div>

        <aside className="properties-panel glass-card-static" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
          <div className="segmented" style={{ margin: '1rem 1rem 0' }}>
            <button className={activeTab === 'properties' ? 'active' : ''} onClick={() => setActiveTab('properties')}><Settings size={16} /> Properties</button>
            <button className={activeTab === 'layers' ? 'active' : ''} onClick={() => setActiveTab('layers')}><Layers size={16} /> Layers</button>
          </div>
          
          <div style={{ padding: '0 1rem 1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeTab === 'layers' ? (
              <div className="layers-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[...elements].reverse().map((el, i) => (
                  <div key={el.id} className={`layer-item ${state.selectedElementId === el.id ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: state.selectedElementId === el.id ? 'var(--primary-light)' : 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.5rem', cursor: 'pointer' }} onClick={() => dispatch({ type: 'SET_SELECTED_ELEMENT', payload: el.id })}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); reorderLayer(el.id, 'up'); }} disabled={el.id === elements[elements.length - 1].id}><ChevronUp size={14} /></button>
                      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); reorderLayer(el.id, 'down'); }} disabled={el.id === elements[0].id}><ChevronDown size={14} /></button>
                    </div>
                    <span style={{ flex: 1, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.name}</span>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); patchElement(el.id, { locked: !el.locked }); }}>
                      {el.locked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); patchElement(el.id, { visible: !el.visible }); }}>
                      {el.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                ))}
                {elements.length === 0 && <p className="muted">No elements yet.</p>}
              </div>
            ) : (
              <>
                {selected ? (
                  <>
                    <label className="input-group"><span className="input-label">Name</span><input className="input" value={selected.name} onChange={(e) => patchElement(selected.id, { name: e.target.value })} /></label>
                    <div className="input-group">
                      <span className="input-label">Align Canvas</span>
                      <div className="segmented">
                        <button title="Align Left" onClick={() => alignSelected('left')}><AlignStartVertical size={16} /></button>
                        <button title="Align Center" onClick={() => alignSelected('center')}><AlignHorizontalSpaceAround size={16} /></button>
                        <button title="Align Right" onClick={() => alignSelected('right')}><AlignEndVertical size={16} /></button>
                      </div>
                      <div className="segmented" style={{ marginTop: '0.5rem' }}>
                        <button title="Align Top" onClick={() => alignSelected('top')}><AlignStartHorizontal size={16} /></button>
                        <button title="Align Middle" onClick={() => alignSelected('middle')}><AlignCenterVertical size={16} /></button>
                        <button title="Align Bottom" onClick={() => alignSelected('bottom')}><AlignEndHorizontal size={16} /></button>
                      </div>
                    </div>
                    {selected.type === 'text' ? (
                      <>
                        <label className="input-group"><span className="input-label">Text</span><textarea className="input" value={selected.text || ''} onChange={(e) => patchElement(selected.id, { text: e.target.value })} /></label>
                        <div className="grid-2 compact">
                          <label className="input-group"><span className="input-label">Font size</span><input className="input" type="number" value={selected.fontSize || 24} onChange={(e) => patchElement(selected.id, { fontSize: Number(e.target.value) })} /></label>
                          <label className="input-group"><span className="input-label">Weight</span><select className="select" value={selected.fontWeight || '400'} onChange={(e) => patchElement(selected.id, { fontWeight: e.target.value })}><option>400</option><option>600</option><option>700</option><option>800</option></select></label>
                        </div>
                        <label className="input-group"><span className="input-label">Text color</span><input className="input" type="color" value={selected.fill || '#0f172a'} onChange={(e) => patchElement(selected.id, { fill: e.target.value })} /></label>
                        <div className="segmented">
                          <button className={selected.align === 'left' ? 'active' : ''} onClick={() => patchElement(selected.id, { align: 'left' })}><AlignLeft size={16} /></button>
                          <button className={selected.align === 'center' ? 'active' : ''} onClick={() => patchElement(selected.id, { align: 'center' })}><AlignCenter size={16} /></button>
                          <button className={selected.align === 'right' ? 'active' : ''} onClick={() => patchElement(selected.id, { align: 'right' })}><AlignRight size={16} /></button>
                        </div>
                        <label className="input-group"><span className="input-label">Letter Spacing</span><input className="input" type="number" value={selected.letterSpacing || 0} step="0.5" onChange={(e) => patchElement(selected.id, { letterSpacing: Number(e.target.value) })} /></label>
                      </>
                    ) : null}
                    {selected.type === 'shape' ? (
                      <label className="input-group"><span className="input-label">Background</span><input className="input" type="color" value={selected.backgroundColor || '#155e75'} onChange={(e) => patchElement(selected.id, { backgroundColor: e.target.value })} /></label>
                    ) : null}
                    {selected.type === 'photo' || selected.type === 'image' ? (
                      <>
                        <label className="input-group">
                          <span className="input-label">Frame Shape</span>
                          <select className="select" value={selected.frameShape || 'rect'} onChange={(e) => patchElement(selected.id, { frameShape: e.target.value as 'rect' | 'circle' })}>
                            <option value="rect">Rectangle</option>
                            <option value="circle">Circle</option>
                          </select>
                        </label>
                        {selected.frameShape !== 'circle' && (
                          <label className="input-group"><span className="input-label">Corner Radius</span><input className="input" type="number" value={selected.cornerRadius || 0} onChange={(e) => patchElement(selected.id, { cornerRadius: Number(e.target.value) })} /></label>
                        )}
                        <div className="grid-2 compact">
                          <label className="input-group"><span className="input-label">Border Width</span><input className="input" type="number" value={selected.borderWidth || 0} onChange={(e) => patchElement(selected.id, { borderWidth: Number(e.target.value) })} /></label>
                          <label className="input-group"><span className="input-label">Border Color</span><input className="input" type="color" value={selected.borderColor || '#ffffff'} onChange={(e) => patchElement(selected.id, { borderColor: e.target.value })} /></label>
                        </div>
                        {selected.type === 'image' && (
                          <button className="btn btn-secondary w-full" style={{ marginBottom: '1rem' }} onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => patchElement(selected.id, { src: ev.target?.result as string });
                              reader.readAsDataURL(file);
                            };
                            input.click();
                          }}>Replace Image</button>
                        )}
                      </>
                    ) : null}
                    <div className="grid-2 compact">
                      <label className="input-group"><span className="input-label">Width</span><input className="input" type="number" value={Math.round(selected.width)} onChange={(e) => patchElement(selected.id, { width: Number(e.target.value) })} /></label>
                      <label className="input-group"><span className="input-label">Height</span><input className="input" type="number" value={Math.round(selected.height)} onChange={(e) => patchElement(selected.id, { height: Number(e.target.value) })} /></label>
                    </div>
                    <label className="input-group"><span className="input-label">Opacity</span><input className="input" type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={(e) => patchElement(selected.id, { opacity: Number(e.target.value) })} /></label>
                    <label className="input-group"><span className="input-label">Rotation</span><input className="input" type="number" value={Math.round(selected.rotation)} onChange={(e) => patchElement(selected.id, { rotation: Number(e.target.value) })} /></label>
                    
                    <div className="input-group" style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      <span className="input-label">Shadow</span>
                      <label className="input-group"><span className="input-label" style={{fontSize: '0.8rem'}}>Color</span><input className="input" type="color" value={selected.shadowColor || '#000000'} onChange={(e) => patchElement(selected.id, { shadowColor: e.target.value })} /></label>
                      <label className="input-group"><span className="input-label" style={{fontSize: '0.8rem'}}>Blur</span><input className="input" type="range" min="0" max="50" value={selected.shadowBlur || 0} onChange={(e) => patchElement(selected.id, { shadowBlur: Number(e.target.value) })} /></label>
                      <div className="grid-2 compact">
                        <label className="input-group"><span className="input-label" style={{fontSize: '0.8rem'}}>Offset X</span><input className="input" type="number" value={selected.shadowOffsetX || 0} onChange={(e) => patchElement(selected.id, { shadowOffsetX: Number(e.target.value) })} /></label>
                        <label className="input-group"><span className="input-label" style={{fontSize: '0.8rem'}}>Offset Y</span><input className="input" type="number" value={selected.shadowOffsetY || 0} onChange={(e) => patchElement(selected.id, { shadowOffsetY: Number(e.target.value) })} /></label>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="muted">Select an element on the card to edit its style.</p>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EditableElement({
  element,
  selected,
  onSelect,
  onChange,
  onEdit,
}: {
  element: CanvasElement;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<CanvasElement>) => void;
  onEdit: () => void;
}) {
  const common = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    draggable: !element.locked,
    shadowColor: element.shadowColor,
    shadowBlur: element.shadowBlur,
    shadowOffsetX: element.shadowOffsetX,
    shadowOffsetY: element.shadowOffsetY,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: onEdit,
    onDblTap: onEdit,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => onChange({ x: event.target.x(), y: event.target.y() }),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      const node = event.target;
      onChange({
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * node.scaleX()),
        height: Math.max(10, node.height() * node.scaleY()),
        rotation: node.rotation(),
      });
      node.scaleX(1);
      node.scaleY(1);
    },
  };

  return (
    <Group>
      {element.type === 'text' ? (
        <Text {...common} text={element.text || ''} fontFamily={element.fontFamily || 'Noto Sans'} fontSize={element.fontSize || 24} fontStyle={element.fontWeight || '400'} fill={element.fill || '#0f172a'} align={element.align || 'left'} lineHeight={element.lineHeight || 1.2} letterSpacing={element.letterSpacing || 0} />
      ) : element.type === 'line' ? (
        <Line {...common} points={element.points || [0, 0, element.width, 0]} stroke={element.stroke || '#155e75'} strokeWidth={element.strokeWidth || 4} />
      ) : element.type === 'photo' ? (
        <Group {...common}>
          {element.frameShape === 'circle' ? (
            <Group clipFunc={(ctx) => ctx.arc(element.width / 2, element.height / 2, Math.min(element.width, element.height) / 2, 0, Math.PI * 2, false)}>
              <Rect width={element.width} height={element.height} fill="#e2e8f0" />
            </Group>
          ) : (
            <Rect width={element.width} height={element.height} fill="#e2e8f0" cornerRadius={element.cornerRadius || 0} />
          )}
          {element.borderWidth && element.borderWidth > 0 && (
            element.frameShape === 'circle' ? (
              <Circle x={element.width / 2} y={element.height / 2} radius={Math.min(element.width, element.height) / 2} stroke={element.borderColor || '#ffffff'} strokeWidth={element.borderWidth} />
            ) : (
              <Rect width={element.width} height={element.height} cornerRadius={element.cornerRadius || 0} stroke={element.borderColor || '#ffffff'} strokeWidth={element.borderWidth} />
            )
          )}
        </Group>
      ) : element.type === 'image' ? (
        <StaticImageNode element={element} common={common} />
      ) : element.type === 'qrcode' ? (
        <Group {...common}><Rect width={element.width} height={element.height} fill="#ffffff" stroke="#0f172a" /><Text text="QR" width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={34} fill="#0f172a" /></Group>
      ) : element.type === 'barcode' ? (
        <Group {...common}><Rect width={element.width} height={element.height} fill="#ffffff" stroke="#94a3b8" /><Text text="CODE128" width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={28} fill="#0f172a" /></Group>
      ) : element.shapeType === 'circle' ? (
        <Circle {...common} radius={Math.min(element.width, element.height) / 2} fill={element.backgroundColor || '#155e75'} />
      ) : (
        <Rect {...common} fill={element.backgroundColor || '#155e75'} cornerRadius={element.cornerRadius || 0} />
      )}
      {selected ? <Transformer rotateEnabled enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']} /> : null}
    </Group>
  );
}

function BackgroundImageNode({ src, width, height }: { src: string; width: number; height: number }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);
  if (!image) return null;
  return <KonvaImage image={image} width={width} height={height} />;
}

function StaticImageNode({ element, common }: { element: CanvasElement, common: any }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!element.src) return;
    const img = new window.Image();
    img.src = element.src;
    img.onload = () => setImage(img);
  }, [element.src]);
  const isCircle = element.frameShape === 'circle';
  const radius = Math.min(element.width, element.height) / 2;
  return (
    <Group {...common}>
      {isCircle ? (
        <Group clipFunc={(ctx) => ctx.arc(element.width / 2, element.height / 2, radius, 0, Math.PI * 2, false)}>
          {image ? <KonvaImage image={image} width={element.width} height={element.height} /> : <Rect width={element.width} height={element.height} fill="#e2e8f0" />}
        </Group>
      ) : (
        image ? <KonvaImage image={image} width={element.width} height={element.height} cornerRadius={element.cornerRadius || 0} /> : <Rect width={element.width} height={element.height} fill="#e2e8f0" cornerRadius={element.cornerRadius || 0} />
      )}
      {element.borderWidth && element.borderWidth > 0 && (
        isCircle ? (
          <Circle x={element.width / 2} y={element.height / 2} radius={radius} stroke={element.borderColor || '#ffffff'} strokeWidth={element.borderWidth} />
        ) : (
          <Rect width={element.width} height={element.height} cornerRadius={element.cornerRadius || 0} stroke={element.borderColor || '#ffffff'} strokeWidth={element.borderWidth} />
        )
      )}
    </Group>
  );
}
