Page: ScarletWell TWIN | Nearby Resources

```html
<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScarletWell TWIN | Nearby Resources</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
    <style>
        :root {
            --ink: #14172B;
            --paper: #F4F6FB;
            --band: #7C8CFF;
            --line: #2F3FD0;
            --win: #F2C14E;
            --mist: #DDE2F0;
            --scarlet: #CC0033;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--ink);
            background-color: var(--paper);
            margin: 0;
            overflow: hidden;
        }

        .heading-tight {
            font-family: 'Figtree', sans-serif;
            letter-spacing: -0.035em;
        }

        .sidebar-nav-item:hover {
            background-color: rgba(47, 63, 208, 0.05);
        }

        .sidebar-nav-item.active {
            background-color: white;
            color: var(--line);
            box-shadow: 0 2px 4px rgba(20, 23, 43, 0.05);
        }

        .main-scroll::-webkit-scrollbar {
            width: 6px;
        }
        .main-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .main-scroll::-webkit-scrollbar-thumb {
            background: var(--mist);
            border-radius: 10px;
        }

        .filter-chip {
            transition: all 0.2s ease;
        }
        .filter-chip:hover {
            border-color: var(--line);
            color: var(--line);
        }

        /* Map specific styles */
        .map-pin {
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        .map-pin:hover {
            transform: translateY(-4px);
        }
    </style>
</head>
<body>
    <div class="flex h-screen bg-[#F4F6FB]" data-sd-id="1">
        <!-- LEFT SIDEBAR -->
        <aside class="w-[280px] h-full bg-[#F4F6FB] border-r border-[#DDE2F0] flex flex-col shrink-0 z-40" data-sd-id="2">
            <!-- Branding -->
            <div class="px-8 pt-10 pb-12" data-sd-id="3">
                <span class="text-[10px] font-bold tracking-[0.2em] text-[#CC0033] uppercase block mb-1" data-sd-id="4">Rutgers</span>
                <h1 class="text-xl font-extrabold heading-tight text-[#14172B]" data-sd-id="5">ScarletWell TWIN</h1>
            </div>

            <!-- Navigation -->
            <nav class="flex-1 px-4 space-y-1" data-sd-id="6">
                <a href="https://p.superdesign.dev/draft/d66f5a62-b648-41a0-a03f-2dd4feda5d72" id="nav-today-link" class="sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[#14172B]/50 font-medium" data-sd-id="7">
                    <iconify-icon icon="lucide:calendar-days" class="text-xl"></iconify-icon>
                    <span data-sd-id="8">Today</span>
                </a>
                <a href="https://p.superdesign.dev/draft/9f815e63-4bce-4349-bbdd-d964cdf594b6" id="nav-eat-link" class="sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[#14172B]/50 font-medium" data-sd-id="9">
                    <iconify-icon icon="lucide:utensils" class="text-xl"></iconify-icon>
                    <span data-sd-id="10">Eat</span>
                </a>
                <a href="https://p.superdesign.dev/draft/86c6ad09-bfe9-44d8-94ae-e0fce01fca9c" id="nav-checkin-link" class="sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[#14172B]/50 font-medium" data-sd-id="11">
                    <iconify-icon icon="lucide:heart-pulse" class="text-xl"></iconify-icon>
                    <span data-sd-id="12">Check-in</span>
                </a>
                <a href="https://p.superdesign.dev/draft/257cb442-3e00-413b-9256-09175022c02a" id="nav-nearby-link" class="sidebar-nav-item active flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold" data-sd-id="13">
                    <iconify-icon icon="lucide:map" class="text-xl"></iconify-icon>
                    <span data-sd-id="14">Nearby</span>
                </a>
                <a href="https://p.superdesign.dev/draft/f1ae7e8d-db83-49aa-bdce-0f837020ba92" id="nav-share-link" class="sidebar-nav-item flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[#14172B]/50 font-medium" data-sd-id="15">
                    <iconify-icon icon="lucide:users" class="text-xl"></iconify-icon>
                    <span data-sd-id="16">Share</span>
                </a>
            </nav>

            <!-- Bottom Actions / Profile -->
            <div class="p-4 mt-auto border-t border-[#DDE2F0]/50 space-y-4" data-sd-id="17">
                <a href="#" id="nav-settings-link" class="flex items-center gap-3 px-4 py-2 rounded-lg text-[#14172B]/40 hover:text-[#14172B] transition-colors" data-sd-id="18">
                    <iconify-icon icon="lucide:settings" class="text-xl"></iconify-icon>
                    <span class="text-sm font-medium" data-sd-id="19">Settings</span>
                </a>
                
                <div class="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-[#DDE2F0]" data-sd-id="20">
                    <div class="w-10 h-10 rounded-full bg-[#DDE2F0] border border-white flex-shrink-0 flex items-center justify-center overflow-hidden" data-sd-id="21">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="Avatar" class="w-full h-full object-cover" data-sd-id="22">
                    </div>
                    <div class="flex flex-col" data-sd-id="23">
                        <span class="text-sm font-semibold text-[#14172B]" data-sd-id="24">Alex Chen</span>
                        <span class="text-[11px] text-[#14172B]/50" data-sd-id="25">Rutgers '26</span>
                    </div>
                    <iconify-icon icon="lucide:chevron-right" class="ml-auto text-[#14172B]/30"></iconify-icon>
                </div>
            </div>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="flex-1 h-full overflow-y-auto main-scroll relative" data-sd-id="26">
            <div class="max-w-[1100px] px-12 pt-16 pb-24 mx-auto" data-sd-id="27">
                <!-- Page Header -->
                <header class="mb-12" data-sd-id="28">
                    <h2 class="text-[44px] font-extrabold heading-tight text-[#14172B] mb-2" data-sd-id="29">Nearby Resources</h2>
                    <p class="text-base text-[#14172B]/50 font-medium" data-sd-id="30">Find wellness resources on campus. Filter by what matters to you.</p>
                </header>

                <!-- Filters & Toggles -->
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8" data-sd-id="31">
                    <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar max-w-full" data-sd-id="32">
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="33">Physical</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="34">Emotional</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="35">Social</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="36">Intellectual</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="37">Spiritual</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="38">Occupational</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="39">Financial</button>
                        <button class="filter-chip whitespace-nowrap px-5 py-2 rounded-full border border-[#DDE2F0] bg-white text-xs font-bold text-[#14172B]/60" data-sd-id="40">Environmental</button>
                    </div>

                    <div class="flex p-1 bg-[#DDE2F0] rounded-xl shrink-0" data-sd-id="41">
                        <button class="px-4 py-1.5 bg-[#2F3FD0] text-white text-xs font-bold rounded-lg transition-all" data-sd-id="42">New Brunswick</button>
                        <button class="px-4 py-1.5 text-[#14172B]/50 text-xs font-bold rounded-lg hover:text-[#14172B]" data-sd-id="43">Newark</button>
                        <button class="px-4 py-1.5 text-[#14172B]/50 text-xs font-bold rounded-lg hover:text-[#14172B]" data-sd-id="44">Camden</button>
                    </div>
                </div>

                <!-- Map Section -->
                <section class="mb-12" data-sd-id="45">
                    <div class="bg-white border border-[#DDE2F0] rounded-[24px] overflow-hidden shadow-sm relative group" data-sd-id="46">
                        <!-- SVG Illustration Map of Rutgers New Brunswick -->
                        <div class="w-full aspect-[21/9] bg-[#F4F6FB] relative" data-sd-id="47">
                            <svg viewBox="0 0 1000 400" class="w-full h-full opacity-60" data-sd-id="48">
                                <!-- Illustrative River (Raritan) -->
                                <path d="M0,350 Q250,300 500,320 T1000,280" fill="none" stroke="#DDE2F0" stroke-width="60"></path>
                                <!-- Campus Paths/Roads -->
                                <path d="M100,50 L300,150 L500,100 L700,150 L900,50" fill="none" stroke="#ffffff" stroke-width="4"></path>
                                <path d="M200,300 L300,150 L400,250" fill="none" stroke="#ffffff" stroke-width="4"></path>
                                <path d="M600,300 L700,150 L800,250" fill="none" stroke="#ffffff" stroke-width="4"></path>
                                <!-- Building Blocks -->
                                <rect x="250" y="80" width="60" height="40" rx="4" fill="#DDE2F0"></rect>
                                <rect x="420" y="120" width="80" height="50" rx="4" fill="#DDE2F0"></rect>
                                <rect x="680" y="70" width="40" height="60" rx="4" fill="#DDE2F0"></rect>
                                <circle cx="500" cy="200" r="30" fill="#DDE2F0" opacity="0.4"></circle>
                            </svg>

                            <!-- Resource Pins -->
                            <!-- Counseling -->
                            <div class="absolute top-[25%] left-[30%] map-pin group/pin" style="view-transition-name: pin-1;" data-sd-id="49">
                                <div class="w-10 h-10 rounded-full bg-[#2F3FD0] border-4 border-white flex items-center justify-center text-white" data-sd-id="50">
                                    <iconify-icon icon="lucide:heart" class="text-lg"></iconify-icon>
                                </div>
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#14172B] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap" data-sd-id="51">Counseling Center</div>
                            </div>
                            
                            <!-- Recreation -->
                            <div class="absolute top-[45%] left-[45%] map-pin group/pin" style="view-transition-name: pin-2;" data-sd-id="52">
                                <div class="w-10 h-10 rounded-full bg-[#2F3FD0] border-4 border-white flex items-center justify-center text-white" data-sd-id="53">
                                    <iconify-icon icon="lucide:dumbbell" class="text-lg"></iconify-icon>
                                </div>
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#14172B] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap" data-sd-id="54">Werblin Gym</div>
                            </div>

                            <!-- Dining -->
                            <div class="absolute top-[35%] left-[70%] map-pin group/pin" style="view-transition-name: pin-3;" data-sd-id="55">
                                <div class="w-10 h-10 rounded-full bg-[#2F3FD0] border-4 border-white flex items-center justify-center text-white" data-sd-id="56">
                                    <iconify-icon icon="lucide:utensils" class="text-lg"></iconify-icon>
                                </div>
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#14172B] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap" data-sd-id="57">Busch Dining Hall</div>
                            </div>

                            <!-- Wellness -->
                            <div class="absolute top-[60%] left-[20%] map-pin group/pin" style="view-transition-name: pin-4;" data-sd-id="58">
                                <div class="w-10 h-10 rounded-full bg-[#2F3FD0] border-4 border-white flex items-center justify-center text-white" data-sd-id="59">
                                    <iconify-icon icon="lucide:leaf" class="text-lg"></iconify-icon>
                                </div>
                                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#14172B] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/pin:opacity-100 transition-opacity whitespace-nowrap" data-sd-id="60">Rutgers Gardens</div>
                            </div>

                            <!-- Controls -->
                            <div class="absolute bottom-6 right-6 flex flex-col gap-2" data-sd-id="61">
                                <button class="w-10 h-10 bg-white border border-[#DDE2F0] rounded-xl flex items-center justify-center text-[#14172B]/60 hover:text-[#14172B] shadow-sm" data-sd-id="62"><iconify-icon icon="lucide:plus"></iconify-icon></button>
                                <button class="w-10 h-10 bg-white border border-[#DDE2F0] rounded-xl flex items-center justify-center text-[#14172B]/60 hover:text-[#14172B] shadow-sm" data-sd-id="63"><iconify-icon icon="lucide:minus"></iconify-icon></button>
                                <button class="w-10 h-10 bg-white border border-[#DDE2F0] rounded-xl flex items-center justify-center text-[#2F3FD0] shadow-sm mt-2" data-sd-id="64"><iconify-icon icon="lucide:crosshair"></iconify-icon></button>
                            </div>

                            <!-- Labels Overlay -->
                            <div class="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between" data-sd-id="65">
                                <div class="flex justify-between" data-sd-id="66">
                                    <span class="text-[10px] font-bold text-[#14172B]/20 uppercase tracking-widest" data-sd-id="67">Busch Campus</span>
                                    <span class="text-[10px] font-bold text-[#14172B]/20 uppercase tracking-widest" data-sd-id="68">Livingston Campus</span>
                                </div>
                                <div class="flex justify-between" data-sd-id="69">
                                    <span class="text-[10px] font-bold text-[#14172B]/20 uppercase tracking-widest" data-sd-id="70">College Ave</span>
                                    <span class="text-[10px] font-bold text-[#14172B]/20 uppercase tracking-widest" data-sd-id="71">Cook/Douglass</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Suggested Walking Routes -->
                <section class="mb-16" data-sd-id="72">
                    <h3 class="text-xl font-bold heading-tight mb-6 flex items-center gap-2" data-sd-id="73">
                        <iconify-icon icon="lucide:footprints" class="text-[#2F3FD0]"></iconify-icon>
                        Steadier energy walking routes
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-sd-id="74">
                        <!-- Route 1 -->
                        <div class="bg-white border border-[#DDE2F0] rounded-[20px] p-6 shadow-sm flex flex-col h-full" data-sd-id="75">
                            <div class="w-10 h-10 bg-[#7C8CFF]/10 rounded-xl flex items-center justify-center mb-4" data-sd-id="76">
                                <iconify-icon icon="lucide:map-pin" class="text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <h4 class="text-lg font-bold heading-tight mb-1" data-sd-id="77">Rutgers Gardens</h4>
                            <p class="text-xs font-semibold text-[#14172B]/40 mb-6 uppercase tracking-wider" data-sd-id="78">0.6 mi walking loop</p>
                            <button class="mt-auto w-full py-3 bg-[#F4F6FB] hover:bg-[#DDE2F0] text-[#2F3FD0] font-bold text-sm rounded-xl transition-all" data-sd-id="79">View route</button>
                        </div>
                        <!-- Route 2 -->
                        <div class="bg-white border border-[#DDE2F0] rounded-[20px] p-6 shadow-sm flex flex-col h-full" data-sd-id="80">
                            <div class="w-10 h-10 bg-[#7C8CFF]/10 rounded-xl flex items-center justify-center mb-4" data-sd-id="81">
                                <iconify-icon icon="lucide:map-pin" class="text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <h4 class="text-lg font-bold heading-tight mb-1" data-sd-id="82">Passion Puddle</h4>
                            <p class="text-xs font-semibold text-[#14172B]/40 mb-6 uppercase tracking-wider" data-sd-id="83">0.4 mi walking loop</p>
                            <button class="mt-auto w-full py-3 bg-[#F4F6FB] hover:bg-[#DDE2F0] text-[#2F3FD0] font-bold text-sm rounded-xl transition-all" data-sd-id="84">View route</button>
                        </div>
                        <!-- Route 3 -->
                        <div class="bg-white border border-[#DDE2F0] rounded-[20px] p-6 shadow-sm flex flex-col h-full" data-sd-id="85">
                            <div class="w-10 h-10 bg-[#7C8CFF]/10 rounded-xl flex items-center justify-center mb-4" data-sd-id="86">
                                <iconify-icon icon="lucide:map-pin" class="text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <h4 class="text-lg font-bold heading-tight mb-1" data-sd-id="87">Voorhees Mall</h4>
                            <p class="text-xs font-semibold text-[#14172B]/40 mb-6 uppercase tracking-wider" data-sd-id="88">0.5 mi walking loop</p>
                            <button class="mt-auto w-full py-3 bg-[#F4F6FB] hover:bg-[#DDE2F0] text-[#2F3FD0] font-bold text-sm rounded-xl transition-all" data-sd-id="89">View route</button>
                        </div>
                        <!-- Route 4 -->
                        <div class="bg-white border border-[#DDE2F0] rounded-[20px] p-6 shadow-sm flex flex-col h-full" data-sd-id="90">
                            <div class="w-10 h-10 bg-[#7C8CFF]/10 rounded-xl flex items-center justify-center mb-4" data-sd-id="91">
                                <iconify-icon icon="lucide:map-pin" class="text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <h4 class="text-lg font-bold heading-tight mb-1" data-sd-id="92">Buccleuch Park</h4>
                            <p class="text-xs font-semibold text-[#14172B]/40 mb-6 uppercase tracking-wider" data-sd-id="93">0.8 mi walking loop</p>
                            <button class="mt-auto w-full py-3 bg-[#F4F6FB] hover:bg-[#DDE2F0] text-[#2F3FD0] font-bold text-sm rounded-xl transition-all" data-sd-id="94">View route</button>
                        </div>
                    </div>
                </section>

                <!-- Nearby Resources List -->
                <section data-sd-id="95">
                    <div class="flex justify-between items-center mb-8" data-sd-id="96">
                        <h3 class="text-xl font-bold heading-tight" data-sd-id="97">Campus Resources</h3>
                        <a href="#" class="text-sm font-bold text-[#2F3FD0] hover:underline" data-sd-id="98">View all</a>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" data-sd-id="99">
                        <!-- Resource Item 1 -->
                        <div class="bg-white/40 border border-[#DDE2F0] rounded-[20px] p-5 flex items-center gap-5 hover:bg-white transition-all cursor-pointer" data-sd-id="100">
                            <div class="w-12 h-12 rounded-2xl bg-[#2F3FD0]/5 flex items-center justify-center shrink-0" data-sd-id="101">
                                <iconify-icon icon="lucide:heart" class="text-xl text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <div class="flex-1" data-sd-id="102">
                                <h5 class="text-sm font-bold text-[#14172B]" data-sd-id="103">Counseling Center</h5>
                                <div class="flex items-center gap-3 mt-1" data-sd-id="104">
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="105">1.2 km away</span>
                                    <span class="w-1 h-1 rounded-full bg-[#DDE2F0]" data-sd-id="106"></span>
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="107">Mon–Fri, 9am–5pm</span>
                                </div>
                            </div>
                            <a href="#" class="text-[#2F3FD0] hover:text-[#1e2cb0]" data-sd-id="108"><iconify-icon icon="lucide:navigation" class="text-lg"></iconify-icon></a>
                        </div>
                        <!-- Resource Item 2 -->
                        <div class="bg-white/40 border border-[#DDE2F0] rounded-[20px] p-5 flex items-center gap-5 hover:bg-white transition-all cursor-pointer" data-sd-id="109">
                            <div class="w-12 h-12 rounded-2xl bg-[#2F3FD0]/5 flex items-center justify-center shrink-0" data-sd-id="110">
                                <iconify-icon icon="lucide:dumbbell" class="text-xl text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <div class="flex-1" data-sd-id="111">
                                <h5 class="text-sm font-bold text-[#14172B]" data-sd-id="112">Sonny Werblin Recreation Center</h5>
                                <div class="flex items-center gap-3 mt-1" data-sd-id="113">
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="114">0.8 km away</span>
                                    <span class="w-1 h-1 rounded-full bg-[#DDE2F0]" data-sd-id="115"></span>
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="116">Daily, 6am–11pm</span>
                                </div>
                            </div>
                            <a href="#" class="text-[#2F3FD0] hover:text-[#1e2cb0]" data-sd-id="117"><iconify-icon icon="lucide:navigation" class="text-lg"></iconify-icon></a>
                        </div>
                        <!-- Resource Item 3 -->
                        <div class="bg-white/40 border border-[#DDE2F0] rounded-[20px] p-5 flex items-center gap-5 hover:bg-white transition-all cursor-pointer" data-sd-id="118">
                            <div class="w-12 h-12 rounded-2xl bg-[#2F3FD0]/5 flex items-center justify-center shrink-0" data-sd-id="119">
                                <iconify-icon icon="lucide:utensils" class="text-xl text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <div class="flex-1" data-sd-id="120">
                                <h5 class="text-sm font-bold text-[#14172B]" data-sd-id="121">Busch Dining Hall</h5>
                                <div class="flex items-center gap-3 mt-1" data-sd-id="122">
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="123">0.3 km away</span>
                                    <span class="w-1 h-1 rounded-full bg-[#DDE2F0]" data-sd-id="124"></span>
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="125">Daily, 7am–8pm</span>
                                </div>
                            </div>
                            <a href="#" class="text-[#2F3FD0] hover:text-[#1e2cb0]" data-sd-id="126"><iconify-icon icon="lucide:navigation" class="text-lg"></iconify-icon></a>
                        </div>
                        <!-- Resource Item 4 -->
                        <div class="bg-white/40 border border-[#DDE2F0] rounded-[20px] p-5 flex items-center gap-5 hover:bg-white transition-all cursor-pointer" data-sd-id="127">
                            <div class="w-12 h-12 rounded-2xl bg-[#2F3FD0]/5 flex items-center justify-center shrink-0" data-sd-id="128">
                                <iconify-icon icon="lucide:stethoscope" class="text-xl text-[#2F3FD0]"></iconify-icon>
                            </div>
                            <div class="flex-1" data-sd-id="129">
                                <h5 class="text-sm font-bold text-[#14172B]" data-sd-id="130">Health Center</h5>
                                <div class="flex items-center gap-3 mt-1" data-sd-id="131">
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="132">0.5 km away</span>
                                    <span class="w-1 h-1 rounded-full bg-[#DDE2F0]" data-sd-id="133"></span>
                                    <span class="text-[11px] font-semibold text-[#14172B]/40" data-sd-id="134">Mon–Fri, 8am–6pm</span>
                                </div>
                            </div>
                            <a href="#" class="text-[#2F3FD0] hover:text-[#1e2cb0]" data-sd-id="135"><iconify-icon icon="lucide:navigation" class="text-lg"></iconify-icon></a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    </div>

</body></html>
```

Please reference this design and implement it into our codebase; Try to understand the structure, which part of our codebase is relevant and implement
