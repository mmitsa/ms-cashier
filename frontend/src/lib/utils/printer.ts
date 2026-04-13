/**
 * Printer utilities for:
 * 1. Receipt printing (thermal printer)
 * 2. Barcode label printing
 * 
 * Uses window.print() for web-based printing with custom print stylesheets
 * For direct thermal printing, ESC/POS commands can be sent via Web Serial API
 */

import type { CartItem } from '@/store/posStore';
import { formatCurrency } from './cn';

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  cashierName: string;
  customerName?: string;
  items: CartItem[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  change: number;
  paymentMethod: string;
  storeName: string;
  storePhone?: string;
  storeAddress?: string;
}

export function printReceipt(data: ReceiptData) {
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) return;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="text-align:right;padding:2px 0">${item.product.name}</td>
      <td style="text-align:center;padding:2px 4px">${item.quantity}</td>
      <td style="text-align:left;padding:2px 0">${formatCurrency(item.unitPrice * item.quantity)}</td>
    </tr>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة ${data.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; width: 80mm; padding: 5mm; font-size: 12px; direction: rtl; }
        .center { text-align: center; }
        .store-name { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: right; border-bottom: 1px solid #000; padding: 3px 0; font-size: 11px; }
        .total-row { font-size: 16px; font-weight: bold; }
        .footer { font-size: 10px; color: #666; margin-top: 10px; }
        @media print { body { width: 100%; padding: 0; } }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="store-name">${data.storeName}</div>
        ${data.storeAddress ? `<div>${data.storeAddress}</div>` : ''}
        ${data.storePhone ? `<div>هاتف: ${data.storePhone}</div>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div style="display:flex;justify-content:space-between;font-size:11px">
        <span>${data.invoiceNumber}</span>
        <span>${data.date}</span>
      </div>
      ${data.customerName ? `<div style="font-size:11px">العميل: ${data.customerName}</div>` : ''}
      <div style="font-size:11px">الكاشير: ${data.cashierName}</div>
      
      <div class="divider"></div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align:right">الصنف</th>
            <th style="text-align:center">الكمية</th>
            <th style="text-align:left">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div class="divider"></div>
      
      <table>
        <tr><td>المجموع</td><td style="text-align:left">${formatCurrency(data.subTotal)}</td></tr>
        ${data.discount > 0 ? `<tr><td>الخصم</td><td style="text-align:left;color:red">-${formatCurrency(data.discount)}</td></tr>` : ''}
        ${data.tax > 0 ? `<tr><td>الضريبة</td><td style="text-align:left">${formatCurrency(data.tax)}</td></tr>` : ''}
        <tr class="total-row"><td>الإجمالي</td><td style="text-align:left">${formatCurrency(data.total)}</td></tr>
        <tr><td>المدفوع (${data.paymentMethod})</td><td style="text-align:left">${formatCurrency(data.paidAmount)}</td></tr>
        ${data.change > 0 ? `<tr><td>الباقي</td><td style="text-align:left">${formatCurrency(data.change)}</td></tr>` : ''}
      </table>
      
      <div class="divider"></div>
      
      <div class="center footer">
        <div>شكراً لتسوقكم معنا</div>
        <div>MPOS System</div>
      </div>
      
      <script>window.onload=function(){window.print();}</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

interface BarcodeLabelData {
  barcode: string;
  name: string;
  price: number;
  quantity?: number;
}

export function printBarcodeLabels(labels: BarcodeLabelData[]) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const labelsHtml = labels
    .map(
      (label) => `
    <div class="label">
      <div class="product-name">${label.name}</div>
      <div class="barcode-container">
        <svg class="barcode" data-barcode="${label.barcode}"></svg>
      </div>
      <div class="barcode-text">${label.barcode}</div>
      <div class="price">${formatCurrency(label.price)}</div>
    </div>
  `
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة باركود</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; }
        .label {
          width: 50mm; height: 30mm; border: 1px dashed #ccc;
          display: inline-flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 2mm; margin: 1mm;
          page-break-inside: avoid;
        }
        .product-name { font-size: 9px; font-weight: bold; text-align: center; max-height: 18px; overflow: hidden; }
        .barcode-container { margin: 2px 0; }
        .barcode-text { font-size: 10px; font-family: monospace; }
        .price { font-size: 12px; font-weight: bold; }
        @media print {
          .label { border: none; }
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      ${labelsHtml}
      <script>window.onload=function(){window.print();}</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
