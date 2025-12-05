import './globals.css';

export const metadata = {
  title: '爱和新标签页',
  description: '极简浏览器起始页',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
