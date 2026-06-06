"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Text, Rect, Image as KonvaImage, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { useEditorStore, CanvasElement } from '@/store/useEditorStore';
import { useDataStore } from '@/store/useDataStore';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

// Custom component to handle Image and QR Code
const CanvasImageElement = ({ element, onSelect, onChange }: { element: CanvasElement, onSelect: () => void, onChange: (newAttrs: Partial<CanvasElement>) => void }) => {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  
  const rows = useDataStore(state => state.rows);
  const activeRowIndex = useDataStore(state => state.activeRowIndex);
  const uploadedPhotos = useDataStore(state => state.uploadedPhotos);

  const activeRow = activeRowIndex !== null ? rows[activeRowIndex] : null;
  const mappedValue = element.mappedColumn && activeRow ? String(activeRow[element.mappedColumn] || '') : null;
  
  useEffect(() => {
    if (element.type === 'QRCODE') {
      const payload = mappedValue || element.qrPayload;
      if (payload) {
        QRCode.toDataURL(payload, { width: Math.max(element.width, 200), margin: 1 })
          .then(url => setQrSrc(url))
          .catch(err => console.error(err));
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQrSrc(null);
      }
    } else if (element.type === 'BARCODE') {
      const payload = mappedValue || element.qrPayload;
      if (payload) {
        try {
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, payload, {
            format: element.barcodeFormat || "CODE128",
            displayValue: true,
            margin: 10,
            background: "#ffffff",
            lineColor: "#000000"
          });
          setQrSrc(canvas.toDataURL("image/png"));
        } catch (err) {
          console.error("Barcode generation failed", err);
          setQrSrc(null);
        }
      } else {
        setQrSrc(null);
      }
    }
  }, [element.type, element.qrPayload, element.barcodeFormat, element.width, mappedValue]);

  let finalSrc = element.type === 'IMAGE' ? (element.src || '') : (qrSrc || '');

  if (element.type === 'IMAGE' && mappedValue) {
    const expectedName = mappedValue.toLowerCase().trim();
    if (uploadedPhotos[expectedName]) {
      finalSrc = uploadedPhotos[expectedName];
    }
  }

  const [image] = useImage(finalSrc);

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      draggable
      clipFunc={(!element.maskType || element.maskType === 'NONE') ? undefined : (ctx) => {
        const w = element.width;
        const h = element.height;
        const mask = element.maskType;

        ctx.beginPath();
        if (mask === 'CIRCLE') {
          ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2, false);
        } else if (mask === 'OVAL') {
          ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        } else if (mask === 'ROUNDED_RECTANGLE') {
          const r = Math.min(20, w / 2, h / 2); // Avoid negative radius
          ctx.moveTo(r, 0);
          ctx.lineTo(w - r, 0);
          ctx.quadraticCurveTo(w, 0, w, r);
          ctx.lineTo(w, h - r);
          ctx.quadraticCurveTo(w, h, w - r, h);
          ctx.lineTo(r, h);
          ctx.quadraticCurveTo(0, h, 0, h - r);
          ctx.lineTo(0, r);
          ctx.quadraticCurveTo(0, 0, r, 0);
        } else if (mask === 'HEXAGON') {
          for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i - 30;
            const angle_rad = Math.PI / 180 * angle_deg;
            const px = w/2 + (w/2) * Math.cos(angle_rad);
            const py = h/2 + (h/2) * Math.sin(angle_rad);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        } else {
          ctx.rect(0, 0, w, h);
        }
        ctx.closePath();
      }}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...element,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * node.scaleX()),
          height: Math.max(5, node.height() * node.scaleY()),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    >
      <KonvaImage
        image={image}
        width={element.width}
        height={element.height}
      />
      {element.mappedColumn && activeRowIndex === null && (
        <Rect
          width={element.width}
          height={element.height}
          fill="rgba(59, 130, 246, 0.4)"
        />
      )}
      {element.mappedColumn && activeRowIndex === null && (
        <Text
          text={`{${element.mappedColumn}}`}
          fill="white"
          fontSize={16}
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          width={element.width}
          height={element.height}
          shadowColor="black"
          shadowBlur={4}
        />
      )}
    </Group>
  );
};

const CanvasTextElement = ({ element, onSelect, onChange }: { element: CanvasElement, onSelect: () => void, onChange: (newAttrs: Partial<CanvasElement>) => void }) => {
  const rows = useDataStore(state => state.rows);
  const activeRowIndex = useDataStore(state => state.activeRowIndex);
  const activeRow = activeRowIndex !== null ? rows[activeRowIndex] : null;
  
  let displayText = element.text || '';
  if (element.mappedColumn) {
    if (activeRow) {
      displayText = String(activeRow[element.mappedColumn] || '');
    } else {
      displayText = `{${element.mappedColumn}}`;
    }
  }
  
  let finalFontSize = element.fontSize || 32;
  if (element.autoFit && displayText.length > 0) {
    const charWidth = 0.6 * finalFontSize;
    const totalTextWidth = displayText.length * charWidth;
    if (!element.wordWrap && totalTextWidth > element.width) {
       finalFontSize = Math.max(10, Math.floor(element.width / (displayText.length * 0.6)));
    }
  }

  return (
    <Text
      id={element.id}
      text={displayText}
      x={element.x}
      y={element.y}
      fontSize={finalFontSize}
      fontFamily={element.fontFamily}
      fill={element.fill}
      wrap={element.wordWrap ? "word" : "none"}
      rotation={element.rotation}
      width={element.width}
      height={element.height}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...element,
          x: e.target.x(),
          y: e.target.y(),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          ...element,
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(5, node.width() * node.scaleX()),
          height: Math.max(5, node.height() * node.scaleY()),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
};


export default function IDCanvas() {
  const { elements, backgroundUrlFront, backgroundUrlBack, activeFace, canvasSize, selectedElementId, setSelectedElementId, updateElement } = useEditorStore();
  const [bgImage] = useImage((activeFace === 'front' ? backgroundUrlFront : backgroundUrlBack) || '');
  
  const trRef = useRef<Konva.Transformer>(null);
  const layerRef = useRef<Konva.Layer>(null);

  useEffect(() => {
    if (selectedElementId && trRef.current && layerRef.current) {
      const node = layerRef.current.findOne(`#${selectedElementId}`);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [selectedElementId, elements]);

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.hasName('bg');
    if (clickedOnEmpty) {
      setSelectedElementId(null);
    }
  };

  // Sort elements by zIndex, filter by activeFace
  const sortedElements = [...elements]
    .filter(el => el.face === activeFace)
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <Stage
      width={canvasSize.width}
      height={canvasSize.height}
      onMouseDown={checkDeselect}
      onTouchStart={checkDeselect}
      style={{ backgroundColor: 'white' }}
    >
      <Layer ref={layerRef}>
        {/* Background */}
        <Rect
          width={canvasSize.width}
          height={canvasSize.height}
          fill="white"
          name="bg"
        />
        {bgImage && (
          <KonvaImage
            image={bgImage}
            width={canvasSize.width}
            height={canvasSize.height}
            name="bg"
          />
        )}

        {sortedElements.map((el) => {
          if (el.type === 'TEXT') {
            return (
              <CanvasTextElement
                key={el.id}
                element={el}
                onSelect={() => setSelectedElementId(el.id)}
                onChange={(newAttrs) => updateElement(el.id, newAttrs)}
              />
            );
          } else {
            return (
              <CanvasImageElement
                key={el.id}
                element={el}
                onSelect={() => setSelectedElementId(el.id)}
                onChange={(newAttrs) => updateElement(el.id, newAttrs)}
              />
            );
          }
        })}
        
        <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => {
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) return oldBox;
          return newBox;
        }} />
      </Layer>
    </Stage>
  );
}
