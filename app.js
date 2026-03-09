document.addEventListener("DOMContentLoaded", () => {
    // --- Constants & State ---
    const API_BASE = "https://phi-lab-server.vercel.app/api/v1/lab";
    let currentIssues = [];
    let currentFilter = 'All';

    // --- DOM Elements ---
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const issuesGrid = document.getElementById('issues-grid');
    const loader = document.getElementById('loader');
    const issueCountEl = document.getElementById('issue-count');
    const tabs = document.querySelectorAll('.tab-btn');
    const searchInput = document.getElementById('search-input');

    const modal = document.getElementById('issue-modal');
    const modalContent = document.getElementById('modal-content');
    const modalLoader = document.getElementById('modal-loader');
    const closeModalBtn = document.getElementById('close-modal');

    // --- Authentication ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value.trim();

        if (user === 'admin' && pass === 'admin123') {
            loginError.classList.add('hidden');
            loginView.classList.add('hidden');
            dashboardView.classList.remove('hidden');
            dashboardView.classList.add('flex');
            fetchIssues();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', () => {
        dashboardView.classList.add('hidden');
        dashboardView.classList.remove('flex');
        loginView.classList.remove('hidden');
        document.getElementById('password').value = ''; // clear password for security
    });

    // --- Tabs & Search ---
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('active-tab');
                t.classList.add('text-gray-500', 'hover:bg-gray-100');
            });
            e.target.classList.add('active-tab');
            e.target.classList.remove('text-gray-500', 'hover:bg-gray-100');
            currentFilter = e.target.getAttribute('data-filter');
            renderIssues();
        });
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    });

    searchInput.addEventListener('input', (e) => {
        if (e.target.value.trim() === '') {
            fetchIssues();
        }
    });

    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));

    // --- Data Fetching ---
    async function fetchIssues() {
        showLoader(true);
        try {
            const response = await fetch(`${API_BASE}/issues`);
            const data = await response.json();
            currentIssues = Array.isArray(data) ? data : (data.data || []);
            renderIssues();
        } catch (error) {
            console.error("Error fetching issues:", error);
            issuesGrid.innerHTML = `<p class="text-red-500 col-span-full text-center mt-10">Failed to load issues.</p>`;
        } finally {
            showLoader(false);
        }
    }

    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            fetchIssues();
            return;
        }
        showLoader(true);
        try {
            const response = await fetch(`${API_BASE}/issues/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            currentIssues = Array.isArray(data) ? data : (data.data || []);
            renderIssues();
        } catch (error) {
            console.error("Error searching issues:", error);
            issuesGrid.innerHTML = `<p class="text-red-500 col-span-full text-center mt-10">Error fetching search results.</p>`;
        } finally {
            showLoader(false);
        }
    }

    // --- Helper Function for Custom Labels & Images ---
    function createLabelsHtml(labelsArray, limit = null) {
        let labels = labelsArray || [];
        if (limit) labels = labels.slice(0, limit);

        return labels.map(label => {
            const text = label.toUpperCase();
            if (text === 'BUG') {
                return `<span class="text-[10px] font-semibold text-red-500 bg-[#FECACA] border border-red-200 px-2 py-1 rounded-full flex items-center gap-1 w-max">
                            <img src="images/bug.png" alt="Bug" class="w-3 h-3 object-contain"> ${text}
                        </span>`;
            } else if (text === 'HELP WANTED') {
                return `<span class="text-[10px] font-semibold text-yellow-600 bg-[#FDE68A] border border-yellow-300 px-2 py-1 rounded-full flex items-center gap-1 w-max">
                            <img src="images/help.png" alt="Help" class="w-3 h-3 object-contain"> ${text}
                        </span>`;
            } else if (text === 'ENHANCEMENT') {
                return `<span class="text-[10px] font-semibold text-green-700 bg-[#BBF7D0] border border-green-300 px-2 py-1 rounded-full flex items-center gap-1 w-max">
                            <img src="images/enhance.png" alt="Enhancement" class="w-3 h-3 object-contain"> ${text}
                        </span>`;
            } else {
                return `<span class="text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-full flex items-center w-max">${text}</span>`;
            }
        }).join('');
    }

    // --- Render Logic ---
    function renderIssues() {
        issuesGrid.innerHTML = '';
        let filteredIssues = currentIssues;

        if (currentFilter !== 'All') {
            filteredIssues = currentIssues.filter(issue =>
                issue.status && issue.status.toLowerCase() === currentFilter.toLowerCase()
            );
        }

        issueCountEl.textContent = `${filteredIssues.length} Issues`;

        if (filteredIssues.length === 0) {
            issuesGrid.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 bg-white rounded-lg border border-dashed">No issues found.</p>`;
            return;
        }

        filteredIssues.forEach(issue => {
            const isOpen = issue.status && issue.status.toLowerCase() === 'open';
            const statusClass = isOpen ? 'card-open' : 'card-closed';

            // Assuming Vector.png is used for both open/closed based on design, otherwise change the false condition path
            const statusIconPath = isOpen ? 'images/Vector.png' : 'images/Vector.png';

            // Set Priority styles
            const priorityText = (issue.priority || 'Normal').toUpperCase();
            let priorityBg = 'bg-gray-100 text-gray-800';
            if (priorityText === 'HIGH') priorityBg = 'bg-red-100 text-red-600 border-red-200';
            if (priorityText === 'MEDIUM') priorityBg = 'bg-yellow-100 text-yellow-700 border-yellow-200';
            if (priorityText === 'LOW') priorityBg = 'bg-blue-100 text-blue-600 border-blue-200';

            const card = document.createElement('div');
            card.className = `bg-white rounded-lg shadow-sm border p-5 cursor-pointer hover:shadow-md transition flex flex-col h-full ${statusClass}`;

            const issueId = issue.id || issue._id;
            card.onclick = () => openIssueModal(issueId);

            const dateStr = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Unknown Date';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="w-8 h-8 rounded-full bg-[#CBFADB] flex justify-center items-center shrink-0">
                        <img src="${statusIconPath}" alt="${isOpen ? 'Open' : 'Closed'} Status" class="w-4 h-4 object-contain">
                    </div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${priorityBg}">${priorityText}</span>
                </div>
                <h3 class="font-bold text-gray-900 mb-2 leading-tight" title="${issue.title}">${issue.title || 'Untitled Issue'}</h3>
                <p class="text-sm text-gray-500 line-clamp-2 mb-4 flex-grow">${issue.description || 'No description provided.'}</p>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${createLabelsHtml(issue.labels, 3)}
                </div>
                
                <div class="text-xs text-gray-400 mt-auto pt-4 flex flex-col border-t border-gray-100">
                    <span class="font-medium text-gray-600">#${issueId || 'N/A'} by ${issue.author || 'Unknown'}</span>
                    <span class="mt-1">${dateStr}</span>
                </div>
            `;
            issuesGrid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    async function openIssueModal(id) {
        if (!id) return;
        modal.classList.remove('hidden');
        modalContent.innerHTML = '';
        modalContent.classList.add('hidden');
        modalLoader.classList.remove('hidden');
        modalLoader.classList.add('flex');

        try {
            const response = await fetch(`${API_BASE}/issue/${id}`);
            const data = await response.json();
            const issue = data.data || data;

            const isOpen = issue.status && issue.status.toLowerCase() === 'open';
            const statusBg = isOpen ? 'bg-green-100 text-green-800 border-green-200' : 'bg-purple-100 text-purple-800 border-purple-200';
            const dateStr = issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'Unknown Date';

            modalContent.innerHTML = `
                <div class="mb-4">
                    <div class="flex items-center space-x-3 mb-2">
                        <span class="text-xs font-semibold px-2 py-1 rounded border ${statusBg}">${(issue.status || 'Unknown').toUpperCase()}</span>
                        <h2 class="text-xl font-bold text-gray-800">${issue.title || 'Untitled'}</h2>
                    </div>
                    <p class="text-sm text-gray-500">Opened by <strong class="text-gray-700">${issue.author || 'Unknown'}</strong> on ${dateStr}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    ${issue.description || 'No description provided.'}
                </div>
                <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <span class="block text-xs text-gray-500 mb-1 uppercase font-semibold">Assignee</span>
                        <span class="font-medium text-sm flex items-center">
                            <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex justify-center items-center mr-2 text-xs font-bold">${(issue.assignee || 'U')[0].toUpperCase()}</div>
                            ${issue.assignee || 'Unassigned'}
                        </span>
                    </div>
                    <div>
                        <span class="block text-xs text-gray-500 mb-1 uppercase font-semibold">Priority</span>
                        <span class="font-semibold text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded border">${(issue.priority || 'Normal').toUpperCase()}</span>
                    </div>
                    <div class="col-span-2 mt-2">
                        <span class="block text-xs text-gray-500 mb-1 uppercase font-semibold">Labels</span>
                        <div class="flex flex-wrap gap-2">
                            ${createLabelsHtml(issue.labels)}
                        </div>
                    </div>
                </div>
            `;
            modalLoader.classList.add('hidden');
            modalLoader.classList.remove('flex');
            modalContent.classList.remove('hidden');
        } catch (error) {
            console.error("Error fetching single issue:", error);
            modalLoader.classList.add('hidden');
            modalContent.innerHTML = `<p class="text-red-500 text-center">Failed to load issue details.</p>`;
            modalContent.classList.remove('hidden');
        }
    }

    function showLoader(show) {
        if (show) {
            loader.classList.remove('hidden');
            loader.classList.add('flex');
            issuesGrid.classList.add('hidden');
        } else {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            issuesGrid.classList.remove('hidden');
        }
    }
});