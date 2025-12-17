'use client';

import { useState, useEffect, useRef } from 'react';
import { Lunar } from 'lunar-javascript';

export default function Home() {
  // --- 状态管理 ---
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [lunarDate, setLunarDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [links, setLinks] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  
  // 背景名称状态
  const [bgName, setBgName] = useState('cat');
  
  // 搜索引擎状态
  const [engines, setEngines] = useState([]);
  const [currentEngine, setCurrentEngine] = useState({ name: '百度', url: 'https://www.baidu.com/s?wd=' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 视频控制状态
  const [startLoadVideo, setStartLoadVideo] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // --- 新增：导航栏收纳逻辑状态 ---
  const [visibleLinks, setVisibleLinks] = useState([]); // 直接显示的链接
  const [hiddenLinks, setHiddenLinks] = useState([]);   // 藏在 ... 里的链接
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // 控制 ... 菜单开关
  const moreMenuRef = useRef(null); // 用于点击外部关闭 ... 菜单

  const searchContainerRef = useRef(null);

  // --- 初始化逻辑 ---
  useEffect(() => {
    // 1. 年份
    setYear(new Date().getFullYear());

    // 2. 背景选择
    const envBg = process.env.NEXT_PUBLIC_BACKGROUND_LIST;
    let bgList = ['cat']; 
    if (envBg) {
      if (envBg === 'all') {
        bgList = ['cat'];
        for (let i = 1; i < 30; i++) {
          bgList.push(`cat${i}`);
        }
      } else {
        bgList = envBg.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (bgList.length > 0) {
      setBgName(bgList[Math.floor(Math.random() * bgList.length)]);
    }

    // 3. 延迟加载视频
    const videoTimer = setTimeout(() => setStartLoadVideo(true), 800); 

    // 4. 读取导航链接 & 处理收纳逻辑
    const handleResize = (allLinks) => {
      // 这里的 768px 是 iPad/手机 和 电脑的分界线
      // 电脑(>768): 显示 20 个 (预留位置给...按钮)
      // 手机(<768): 显示 10 个
      const limit = window.innerWidth > 768 ? 20 : 10;
      
      if (allLinks.length > limit) {
        setVisibleLinks(allLinks.slice(0, limit));
        setHiddenLinks(allLinks.slice(limit));
      } else {
        setVisibleLinks(allLinks);
        setHiddenLinks([]);
      }
    };

    const envLinks = process.env.NEXT_PUBLIC_NAV_LINKS;
    let parsedLinks = [{ name: '演示-淘宝', url: 'https://www.taobao.com' }];
    
    if (envLinks) {
      try { parsedLinks = JSON.parse(envLinks); } 
      catch (e) { console.error("导航链接解析失败", e); }
    }
    setLinks(parsedLinks); // 保存完整列表
    handleResize(parsedLinks); // 初始化切分

    // 监听窗口大小变化，动态调整显示的个数
    const onResize = () => handleResize(parsedLinks);
    window.addEventListener('resize', onResize);

    // 5. 读取搜索引擎
    const envEngines = process.env.NEXT_PUBLIC_SEARCH_ENGINES;
    let loadedEngines = [
      { name: '百度', url: 'https://www.baidu.com/s?wd=' },
      { name: 'Google', url: 'https://www.google.com/search?q=' },
      { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
      { name: '必应', url: 'https://www.bing.com/search?q=' },
      { name: '360', url: 'https://www.so.com/s?q=' },
      { name: '搜狗', url: 'https://www.sogou.com/web?query=' },
    ];
    if (envEngines) {
      try {
        const parsed = JSON.parse(envEngines);
        if (parsed.length > 0) loadedEngines = parsed;
      } catch (e) { console.error("搜索引擎配置解析失败", e); }
    }
    setEngines(loadedEngines);
    setCurrentEngine(loadedEngines[0]);

    // 6. 时间更新
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', weekday: 'long' }));
      const lunar = Lunar.fromDate(now);
      setLunarDate(`农历 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // 7. 点击外部关闭所有菜单
    const handleClickOutside = (event) => {
      // 关闭搜索下拉
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // 关闭更多链接菜单
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(timer);
      clearTimeout(videoTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- 事件处理 ---
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `${currentEngine.url}${encodeURIComponent(searchQuery)}`;
  };

  const handleEngineSelect = (engine) => {
    setCurrentEngine(engine);
    setIsDropdownOpen(false);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden text-white font-sans">
      
      {/* 1. 静态占位图 */}
      <img 
        src={`/background/${bgName}.jpg`}
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* 2. 背景视频 */}
      {startLoadVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          key={bgName} 
          onCanPlay={() => setIsVideoReady(true)}
          className={`
            absolute top-0 left-0 w-full h-full object-cover z-0
            transition-opacity duration-1000 ease-in-out
            ${isVideoReady ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <source src={`/background/${bgName}.mp4`} type="video/mp4" />
        </video>
      )}
      
      {/* 遮罩层 */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/10 z-10 pointer-events-none" />

      {/* GitHub 图标 */}
      <a
        href="https://github.com/kayaladream/cat-new-tab"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 z-50 text-white/70 hover:text-white transition-all duration-300 hover:scale-110 drop-shadow-md"
        title="在 GitHub 上查看源码"
      >
        <svg height="28" width="28" viewBox="0 0 16 16" version="1.1" aria-hidden="true" fill="currentColor">
          <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
      </a>

      {/* 主体内容 */}
      <div className="relative z-20 flex flex-col items-center pt-44 h-full w-full px-4">
        {/* 时钟 */}
        <div className="flex items-end gap-3 mb-8 drop-shadow-md select-none">
          <h1 className="text-7xl font-light tracking-wide">{time}</h1>
          <div className="flex flex-col text-sm font-medium opacity-90 pb-2 gap-1">
            <span>{date}</span>
            <span className="text-xs opacity-70 tracking-wider">{lunarDate}</span>
          </div>
        </div>

        {/* 搜索框容器 */}
        <form 
          ref={searchContainerRef}
          onSubmit={handleSearch} 
          className="w-full max-w-xl relative z-50"
        >
          <div className="relative flex items-center bg-white/90 backdrop-blur-sm rounded-full h-12 px-2 shadow-lg transition-all duration-300 hover:bg-white">
            <button
              type="button" 
              className="pl-4 pr-3 flex items-center gap-1 cursor-pointer border-r border-gray-300/50 h-3/5 hover:opacity-70 transition-opacity focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-gray-600 text-sm font-bold select-none whitespace-nowrap min-w-[3em] text-center">
                {currentEngine.name}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-14 left-0 w-36 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {engines.map((engine, index) => (
                  <div
                    key={index}
                    onClick={() => handleEngineSelect(engine)}
                    className={`
                      px-4 py-2 text-sm cursor-pointer rounded-lg transition-all duration-200
                      hover:bg-black/5 hover:scale-105
                      ${currentEngine.name === engine.name ? 'text-black font-extrabold' : 'text-gray-600 font-medium'}
                    `}
                  >
                    {engine.name}
                  </div>
                ))}
              </div>
            )}

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-800 text-sm h-full px-3"
              autoFocus
            />

            <button type="submit" className="h-9 w-9 bg-[#2c2c2c] rounded-full flex items-center justify-center hover:bg-black transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* 
        底部导航区域 
        修改点：
        1. max-w-6xl: 限制最大宽度，不再铺满全屏，制造大约 6cm 的左右留白。
        2. px-8 sm:px-16: 在小屏幕上也有足够的内边距。
      */}
      <div className="absolute bottom-0 w-full z-30 pb-[75px] sm:pb-[107px]">
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-blue-300/20 to-transparent pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-16 flex flex-wrap justify-center gap-2 sm:gap-4">
          
          {/* 渲染可见的链接 (Desktop <= 20, Mobile <= 10) */}
          {visibleLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              className="
                text-sm sm:text-base font-medium text-white/90 tracking-wider 
                px-3 py-2 rounded-full transition-all duration-200
                hover:bg-white/20 hover:text-white hover:backdrop-blur-sm
              "
            >
              {link.name}
            </a>
          ))}

          {/* 如果有隐藏的链接，显示 "..." 按钮 */}
          {hiddenLinks.length > 0 && (
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="
                  text-sm sm:text-base font-bold text-white/90 tracking-wider 
                  w-10 h-9 flex items-center justify-center rounded-full transition-all duration-200
                  hover:bg-white/20 hover:text-white hover:backdrop-blur-sm
                "
              >
                •••
              </button>

              {/* ... 的弹出菜单 (向上弹出) */}
              {isMoreMenuOpen && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-40 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                   {hiddenLinks.map((link, idx) => (
                     <a
                       key={idx}
                       href={link.url}
                       target="_blank" // 下拉菜单里的建议还是新标签页打开，体验更好
                       rel="noopener noreferrer"
                       className="
                         block px-4 py-2.5 text-sm text-center text-gray-700 font-medium rounded-lg
                         transition-all duration-200
                         hover:bg-black/5 hover:text-black
                       "
                     >
                       {link.name}
                     </a>
                   ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* 底部版权信息 */}
      <div className="absolute bottom-4 w-full text-center z-40">
        <p className="text-[10px] sm:text-xs text-white/40 font-light tracking-wider select-none">
          Copyright © {year} KayalaDream All Rights Reserved
        </p>
      </div>

    </main>
  );
}
