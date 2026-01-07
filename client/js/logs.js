// client/js/logs.js - Dashboard logic for viewing and filtering logs

(function(){
  let currentPage = 1;
  const logsPerPage = 20;
  let allLogs = [];

  window.loadLogs = async function() {
    const logType = document.getElementById('logType').value;
    if (!logType) {
      alert('Vui lòng chọn loại log');
      return;
    }

    try {
      const response = await fetch(`/api/logs?type=${logType}`);
      const data = await response.json();
      
      if (!data.success) throw new Error(data.message || 'Không thể tải logs');
      
      allLogs = data.logs || [];
      currentPage = 1;
      displayLogs();
    } catch (err) {
      alert('Lỗi tải logs: ' + err.message);
      console.error(err);
    }
  };

  function formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('vi-VN');
    } catch (e) {
      return timestamp;
    }
  }

  function formatDetails(data) {
    try {
      const str = JSON.stringify(data, null, 2);
      return str.slice(0, 300) + (str.length > 300 ? '...' : '');
    } catch (e) {
      return JSON.stringify(data);
    }
  }

  function displayLogs() {
    const tbody = document.getElementById('logsBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allLogs.filter(log => 
      JSON.stringify(log).toLowerCase().includes(searchTerm)
    );

    const start = (currentPage - 1) * logsPerPage;
    const end = start + logsPerPage;
    const pageLogs = filtered.slice(start, end);

    if (pageLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Không có logs</td></tr>`;
      document.getElementById('pageInfo').textContent = `Trang ${currentPage}`;
      document.getElementById('prevBtn').disabled = true;
      document.getElementById('nextBtn').disabled = true;
      return;
    }

    tbody.innerHTML = pageLogs.map(log => {
      const details = { ...log };
      delete details.timestamp;
      delete details.level;
      delete details.message;

      return `
        <tr>
          <td class="timestamp">${formatTimestamp(log.timestamp)}</td>
          <td><span class="level-${log.level}">${log.level}</span></td>
          <td>${escapeHtml(log.message)}</td>
          <td class="details-cell">${escapeHtml(formatDetails(details))}</td>
        </tr>
      `;
    }).join('');

    const totalPages = Math.ceil(filtered.length / logsPerPage);
    document.getElementById('pageInfo').textContent = `Trang ${currentPage} / ${totalPages} (${filtered.length} logs)`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = end >= filtered.length;
  }

  window.nextPage = function() {
    currentPage++;
    displayLogs();
  };

  window.previousPage = function() {
    if (currentPage > 1) currentPage--;
    displayLogs();
  };

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  document.getElementById('searchInput').addEventListener('keyup', displayLogs);
  document.getElementById('logType').addEventListener('change', () => {
    document.getElementById('logsBody').innerHTML = `<tr><td colspan="4" class="empty-state">Nhấn "Tải Logs" để lấy dữ liệu</td></tr>`;
  });
})();
