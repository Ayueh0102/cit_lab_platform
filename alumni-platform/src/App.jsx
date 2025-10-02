import React, { useState, useEffect } from 'react';
import './App.css';

const LOGIN_BACKGROUNDS = [
  '/1pUKi5OAcIzv.jpg',
  '/qkeRU7UuJgUz.jpg',
  '/V5NuOmCGmG2t.jpg',
  '/sRO91qLdH1e7.jpg',
];

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [activeLoginSlide, setActiveLoginSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (LOGIN_BACKGROUNDS.length <= 1) {
      return undefined;
    }

    const slideshow = setInterval(() => {
      setActiveLoginSlide((index) => (index + 1) % LOGIN_BACKGROUNDS.length);
    }, 7000);

    return () => clearInterval(slideshow);
  }, []);

  // 狀態管理
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: '光學工程師',
      company: '台積電',
      location: '新竹',
      salary: '80-120萬',
      description: '負責先進製程光學系統設計與優化，需具備光學設計軟體操作經驗，熟悉Zemax、LightTools等工具。',
      author: '張工程師',
      authorId: 'zhang123',
      requests: 12,
      benefits: ['健保', '勞保', '年終獎金', '股票選擇權'],
      requirements: ['光學工程相關科系', '3年以上經驗', '熟悉光學設計軟體']
    },
    {
      id: 2,
      title: '色彩科學研究員',
      company: 'Apple',
      location: '台北',
      salary: '100-150萬',
      description: '研發新一代顯示器色彩管理技術，需熟悉色彩空間轉換與校正，具備Python、MATLAB程式能力。',
      author: '李研究員',
      authorId: 'lee456',
      requests: 8,
      benefits: ['健保', '勞保', '彈性工時', '員工餐廳'],
      requirements: ['色彩科學相關背景', '程式設計能力', '英文流利']
    },
    {
      id: 3,
      title: 'LED照明設計師',
      company: '億光電子',
      location: '台中',
      salary: '70-100萬',
      description: '設計高效能LED照明產品，需具備光學模擬與熱管理經驗，熟悉TracePro、ANSYS等軟體。',
      author: '林設計師',
      authorId: 'lin789',
      requests: 5,
      benefits: ['健保', '勞保', '績效獎金'],
      requirements: ['LED相關經驗', '熱管理知識', '模擬軟體操作']
    }
  ]);

  const [events, setEvents] = useState([
    {
      id: 1,
      title: '2025年度系友大會',
      description: '年度系友聚會，分享職涯經驗與學術發展近況。今年特別邀請多位傑出系友分享創業經驗，並安排實驗室參觀與技術展示。',
      date: '2025-10-15',
      time: '14:00',
      location: '國立清華大學',
      capacity: 100,
      registered: 67,
      category: '年度聚會',
      organizer: '系友會',
      image: '/1pUKi5OAcIzv.jpg',
      registeredUsers: []
    },
    {
      id: 2,
      title: '光學產業趨勢講座',
      description: '邀請業界專家分享最新光學技術趨勢與市場機會。深入探討AR/VR、自駕車光達、量子光學等前沿技術的發展與應用。',
      date: '2025-11-08',
      time: '19:00',
      location: '線上會議',
      capacity: 200,
      registered: 143,
      category: '專業講座',
      organizer: '學術委員會',
      image: '/qkeRU7UuJgUz.jpg',
      registeredUsers: []
    },
    {
      id: 3,
      title: '系友聯誼分享會',
      description: '輕鬆的系友聯誼活動，促進不同屆系友間的交流與合作。安排小組討論、經驗分享與職涯諮詢，並有豐富的茶點與抽獎活動。',
      date: '2025-11-22',
      time: '18:30',
      location: '台北科技大學',
      capacity: 80,
      registered: 45,
      category: '聯誼活動',
      organizer: '聯誼委員會',
      image: '/yC67yJVMf2Jl.jpg',
      registeredUsers: []
    }
  ]);

  const [alumni, _setAlumni] = useState([
    {
      id: 1,
      name: '王小明',
      year: '2020年畢業',
      company: 'ASUS',
      title: '光學工程師',
      location: '台北',
      skills: ['光學設計', 'Zemax', 'Python'],
      experience: '3年',
      contacts: 15,
      messages: 18,
      email: 'wang@example.com'
    },
    {
      id: 2,
      name: '李美華',
      year: '2019年畢業',
      company: 'MediaTek',
      title: '色彩科學研究員',
      location: '新竹',
      skills: ['色彩科學', 'MATLAB', '顯示技術'],
      experience: '4年',
      contacts: 23,
      messages: 25,
      email: 'lee@example.com'
    },
    {
      id: 3,
      name: '張志偉',
      year: '2018年畢業',
      company: '台積電',
      title: '製程工程師',
      location: '新竹',
      skills: ['製程技術', '光學檢測', '品質管理'],
      experience: '5年',
      contacts: 31,
      messages: 28,
      email: 'zhang@example.com'
    },
    {
      id: 4,
      name: '陳雅婷',
      year: '2021年畢業',
      company: '友達光電',
      title: '顯示技術工程師',
      location: '桃園',
      skills: ['LCD技術', 'OLED', '光學量測'],
      experience: '2年',
      contacts: 12,
      messages: 15,
      email: 'chen@example.com'
    },
    {
      id: 5,
      name: '林建宏',
      year: '2017年畢業',
      company: '工研院',
      title: '資深研究員',
      location: '新竹',
      skills: ['雷射技術', '光通訊', '專利撰寫'],
      experience: '6年',
      contacts: 28,
      messages: 32,
      email: 'lin@example.com'
    },
    {
      id: 6,
      name: '黃淑芬',
      year: '2016年畢業',
      company: '奇美實業',
      title: '產品經理',
      location: '台南',
      skills: ['產品管理', '市場分析', '專案管理'],
      experience: '7年',
      contacts: 35,
      messages: 40,
      email: 'huang@example.com'
    }
  ]);

  const [announcements, _setAnnouncements] = useState([
    {
      id: 1,
      title: '🎉 系友會網站正式上線！',
      content: '歡迎各位系友使用全新的系友會社群平台，一起建立更緊密的連結。平台提供職缺分享、活動報名、系友名錄等豐富功能。',
      author: '系友會公告',
      date: '2025-09-30',
      pinned: true,
      category: '系友會公告',
      tags: ['重要', '新功能']
    },
    {
      id: 2,
      title: '🏆 恭賀！系友榮獲國際光學獎項',
      content: '恭喜2018年畢業系友陳博士榮獲國際光學學會年度青年學者獎，表彰其在量子光學領域的傑出貢獻。這是本所系友首次獲得此殊榮！',
      author: '系友動態',
      date: '2025-09-28',
      pinned: false,
      category: '系友動態',
      tags: ['獲獎', '國際榮譽']
    },
    {
      id: 3,
      title: '🔬 最新研究：量子點顯示技術突破',
      content: '本所最新研究成果在Nature Photonics期刊發表，展現量子點技術新進展。研究團隊成功開發出高效率、長壽命的量子點材料。',
      author: '學術新知',
      date: '2025-09-25',
      pinned: false,
      category: '學術新知',
      tags: ['研究成果', '期刊發表']
    },
    {
      id: 4,
      title: '📅 2025年度系友大會籌備進度',
      content: '2025年度系友大會籌備工作進展順利，目前已確認主講嘉賓和活動流程。歡迎系友踴躍報名參加，共同參與這個年度盛會。',
      author: '活動籌備',
      date: '2025-09-20',
      pinned: false,
      category: '活動公告',
      tags: ['系友大會', '籌備進度']
    }
  ]);

  const [notifications, setNotifications] = useState([
    { id: 1, type: '職缺', title: '新職缺發布通知', message: '張工程師發布了「光學工程師」職缺', time: '2小時前', read: false },
    { id: 2, type: '活動', title: '活動報名確認', message: '您已成功報名「2025年度系友大會」', time: '1天前', read: false },
    { id: 3, type: '系友', title: '新系友加入', message: '李美華加入了系友會平台', time: '2天前', read: true },
    { id: 4, type: '公告', title: '重要公告', message: '系友會網站正式上線！', time: '3天前', read: true },
    { id: 5, type: '職缺', title: '交流請求', message: '王小明想要與您交流「色彩科學研究員」職缺', time: '4天前', read: false },
    { id: 6, type: '活動', title: '活動提醒', message: '「光學產業趨勢講座」將於明天舉行', time: '5天前', read: true },
    { id: 7, type: '系友', title: '聯繫請求', message: '陳雅婷想要與您建立聯繫', time: '1週前', read: false }
  ]);

  const [jobRequests, setJobRequests] = useState([
    { id: 1, jobId: 1, requesterName: '王小明', requesterId: 'wang123', status: 'pending', message: '希望能了解更多關於這個職位的詳細資訊' },
    { id: 2, jobId: 1, requesterName: '李美華', requesterId: 'lee456', status: 'pending', message: '對這個職位很感興趣，想要進一步交流' },
    { id: 3, jobId: 2, requesterName: '張志偉', requesterId: 'zhang789', status: 'approved', message: '想了解Apple的工作環境和發展機會' }
  ]);

  const [userProfile, setUserProfile] = useState({
    name: '系統管理員',
    email: 'admin@example.com',
    year: '2018年畢業',
    company: '系友會',
    title: '系統管理員',
    location: '台北',
    phone: '0912-345-678',
    skills: ['系統管理', '網站開發', '資料庫管理'],
    bio: '負責系友會平台的技術維護與功能開發，致力於為系友提供更好的服務。',
    workExperience: [
      {
        id: 1,
        company: '系友會',
        position: '系統管理員',
        startDate: '2020-01',
        endDate: '',
        current: true,
        location: '台北',
        description: '負責系友會平台的技術維護、功能開發與系統管理工作。'
      },
      {
        id: 2,
        company: '科技公司',
        position: '軟體工程師',
        startDate: '2018-07',
        endDate: '2019-12',
        current: false,
        location: '新竹',
        description: '參與網站開發專案，負責前端與後端程式設計。'
      }
    ]
  });

  // 用戶資料
  const users = [
    { email: 'admin@example.com', password: 'admin123', role: 'admin', name: '系統管理員', year: '2018年畢業' },
    { email: 'wang@example.com', password: 'password123', role: 'user', name: '王小明', year: '2020年畢業' },
    { email: 'lee@example.com', password: 'password123', role: 'user', name: '李美華', year: '2019年畢業' }
  ];

  // 登入功能
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
      showMessage(`歡迎回來，${user.name}！`);
    } else {
      showMessage('登入失敗！請檢查帳號密碼。\n\n測試帳號：\n管理員：admin@example.com / admin123\n一般用戶：wang@example.com / password123');
    }
  };

  // 登出功能
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
    showMessage('已成功登出！');
  };

  // 顯示訊息
  const showMessage = (message) => {
    setModalContent(message);
    setShowModal(true);
  };

  // 職缺相關功能
  const handleJobRequest = (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    const newRequest = {
      id: Date.now(),
      jobId: jobId,
      requesterName: currentUser.name,
      requesterId: currentUser.email,
      status: 'pending',
      message: `${currentUser.name} 想要與您交流「${job.title}」職缺`
    };
    setJobRequests([...jobRequests, newRequest]);
    
    // 更新職缺請求數量
    setJobs(jobs.map(j => j.id === jobId ? {...j, requests: j.requests + 1} : j));
    
    // 新增通知
    addNotification('職缺', '交流請求已發送', `您已向 ${job.author} 發送「${job.title}」的交流請求`);
    
    showMessage(`已向 ${job.author} 發送交流請求！`);
  };

  const handleJobRequestResponse = (requestId, response) => {
    const request = jobRequests.find(r => r.id === requestId);
    setJobRequests(jobRequests.map(r => 
      r.id === requestId ? {...r, status: response} : r
    ));
    
    const action = response === 'approved' ? '同意' : '婉拒';
    addNotification('職缺', `交流請求${action}`, `您${action}了 ${request.requesterName} 的交流請求`);
    showMessage(`已${action} ${request.requesterName} 的交流請求！`);
  };

  // 活動相關功能
  const handleEventRegistration = (eventId) => {
    const event = events.find(e => e.id === eventId);
    if (event.registered >= event.capacity) {
      showMessage('很抱歉，活動已額滿！');
      return;
    }
    
    if (event.registeredUsers.includes(currentUser.email)) {
      showMessage('您已經報名過此活動！');
      return;
    }
    
    setEvents(events.map(e => 
      e.id === eventId ? {
        ...e, 
        registered: e.registered + 1,
        registeredUsers: [...e.registeredUsers, currentUser.email]
      } : e
    ));
    
    addNotification('活動', '報名成功', `您已成功報名「${event.title}」`);
    showMessage(`成功報名「${event.title}」！`);
  };

  const handleEventShare = (eventId) => {
    const event = events.find(e => e.id === eventId);
    const shareText = `推薦活動：${event.title}\n時間：${event.date} ${event.time}\n地點：${event.location}\n\n${event.description}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      showMessage('活動資訊已複製到剪貼簿！');
    }
  };

  // 系友名錄功能
  const handleContactAlumni = (alumniId) => {
    const alumni = getAlumniById(alumniId);
    addNotification('系友', '聯繫請求已發送', `您已向 ${alumni.name} 發送聯繫請求`);
    showMessage(`已向 ${alumni.name} 發送聯繫請求！`);
  };

  const handleViewProfile = (alumniId) => {
    const alumni = getAlumniById(alumniId);
    const profileInfo = `
姓名：${alumni.name}
畢業年份：${alumni.year}
公司：${alumni.company}
職位：${alumni.title}
地點：${alumni.location}
專長：${alumni.skills.join(', ')}
經驗：${alumni.experience}
聯繫統計：${alumni.contacts}
訊息統計：${alumni.messages}
    `;
    showMessage(profileInfo);
  };

  // 個人檔案功能
  const handleEditProfile = () => {
    setIsEditing(true);
    showMessage('已進入編輯模式，您可以修改個人資料。');
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
    addNotification('系統', '檔案更新', '您的個人檔案已成功更新');
    showMessage('個人檔案已成功儲存！');
  };

  const handleLinkedInSync = () => {
    // 模擬 LinkedIn 同步
    const linkedInData = {
      skills: [...userProfile.skills, 'LinkedIn同步', '社群媒體', '專業網絡'],
      workExperience: [
        ...userProfile.workExperience,
        {
          id: Date.now(),
          company: 'LinkedIn同步公司',
          position: '從LinkedIn同步的職位',
          startDate: '2023-01',
          endDate: '2023-12',
          current: false,
          location: '遠端工作',
          description: '這是從LinkedIn同步的工作經歷資料。'
        }
      ]
    };
    
    setUserProfile({...userProfile, ...linkedInData});
    addNotification('系統', 'LinkedIn同步完成', '已成功從LinkedIn同步您的專業資料');
    showMessage('已成功從LinkedIn同步專業資料！');
  };

  const _addWorkExperience = (experience) => {
    const newExperience = {
      ...experience,
      id: Date.now()
    };
    setUserProfile({
      ...userProfile,
      workExperience: [...userProfile.workExperience, newExperience]
    });
    showMessage('工作經歷已新增！');
  };

  const removeWorkExperience = (experienceId) => {
    setUserProfile({
      ...userProfile,
      workExperience: userProfile.workExperience.filter(exp => exp.id !== experienceId)
    });
    showMessage('工作經歷已刪除！');
  };

  // 公佈欄功能
  const handleReadMore = (announcementId) => {
    const announcement = announcements.find(a => a.id === announcementId);
    showMessage(`${announcement.title}\n\n${announcement.content}\n\n發布者：${announcement.author}\n日期：${announcement.date}`);
  };

  // 通知功能
  const addNotification = (type, title, message) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      time: '剛剛',
      read: false
    };
    setNotifications([newNotification, ...notifications]);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? {...n, read: true} : n
    ));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
    showMessage('所有通知已標記為已讀！');
  };

  // 搜尋功能
  const handleSearch = (term) => {
    if (!term.trim()) {
      showMessage('請輸入搜尋關鍵字！');
      return;
    }
    setSearchTerm(term);
    showMessage(`搜尋「${term}」的結果已更新！`);
  };

  // 輔助函數
  const getAlumniById = (id) => alumni.find(a => a.id === id);
  const getUnreadNotificationCount = () => notifications.filter(n => !n.read).length;
  const getPendingJobRequests = () => jobRequests.filter(r => r.status === 'pending');

  // 過濾函數
  const filteredAlumni = searchTerm ?
    alumni.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : alumni;

  const filteredAnnouncements = searchTerm ?
    announcements.filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
    ) : announcements;

  // CSV 匯入/匯出功能 (僅管理員)
  const API_BASE_URL = 'http://localhost:5001';

  // 取得 Token (模擬,實際應從 localStorage 或 state 取得)
  const getAuthToken = () => {
    // 這裡應該從實際的登入狀態取得 token
    // 暫時使用模擬 token
    return localStorage.getItem('authToken') || '';
  };

  // CSV 匯出功能
  const handleExportUsers = async () => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/export/users`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `系友帳號清單_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification('系統', 'CSV 匯出成功', '系友帳號清單已成功匯出');
        showMessage('✅ 系友帳號清單匯出成功！');
      } else {
        showMessage('❌ 匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ 匯出失敗：' + error.message);
    }
  };

  const handleExportJobs = async () => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/export/jobs`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `職缺發布清單_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification('系統', 'CSV 匯出成功', '職缺發布清單已成功匯出');
        showMessage('✅ 職缺發布清單匯出成功！');
      } else {
        showMessage('❌ 匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ 匯出失敗：' + error.message);
    }
  };

  const handleExportEvents = async () => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/export/events`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `活動清單_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification('系統', 'CSV 匯出成功', '活動清單已成功匯出');
        showMessage('✅ 活動清單匯出成功！');
      } else {
        showMessage('❌ 匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ 匯出失敗：' + error.message);
    }
  };

  const handleExportBulletins = async () => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/export/bulletins`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `公告發布清單_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification('系統', 'CSV 匯出成功', '公告發布清單已成功匯出');
        showMessage('✅ 公告發布清單匯出成功！');
      } else {
        showMessage('❌ 匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ 匯出失敗：' + error.message);
    }
  };

  const handleExportAll = async () => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/export/all`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `系友會資料匯出_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        addNotification('系統', 'CSV 批次匯出成功', '所有資料已成功匯出為 ZIP 檔');
        showMessage('✅ 所有資料匯出成功！已下載 ZIP 檔');
      } else {
        showMessage('❌ 匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('Export error:', error);
      showMessage('❌ 匯出失敗：' + error.message);
    }
  };

  // CSV 匯入功能
  const handleImportCSV = async (type, file) => {
    if (currentUser.role !== 'admin') {
      showMessage('⚠️ 此功能僅限管理員使用！');
      return;
    }

    if (!file) {
      showMessage('❌ 請選擇檔案');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/csv/import/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const typeName = {
          'users': '系友帳號',
          'jobs': '職缺',
          'bulletins': '公告'
        }[type];

        let message = `✅ ${typeName}匯入成功！\n\n`;
        message += `新增: ${result.imported} 筆\n`;
        message += `更新: ${result.updated} 筆\n`;
        message += `總計: ${result.total} 筆`;

        if (result.errors && result.errors.length > 0) {
          message += `\n\n⚠️ 錯誤 (${result.errors.length} 筆):\n`;
          message += result.errors.slice(0, 5).join('\n');
          if (result.errors.length > 5) {
            message += `\n... 還有 ${result.errors.length - 5} 個錯誤`;
          }
        }

        addNotification('系統', `${typeName}匯入完成`, `匯入了 ${result.total} 筆資料`);
        showMessage(message);

        // 匯入成功後重新載入頁面以顯示新資料
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showMessage('❌ 匯入失敗：' + (result.error || '未知錯誤'));
      }
    } catch (error) {
      console.error('Import error:', error);
      showMessage('❌ 匯入失敗：' + error.message);
    }
  };

  // 登入頁面
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-background" aria-hidden="true">
          {LOGIN_BACKGROUNDS.map((src, index) => (
            <div
              key={src}
              className={`login-slide ${index === activeLoginSlide ? 'is-active' : ''}`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="login-overlay" />
        </div>

        <div className="login-content">
          <div className="login-card">
            <h1 className="login-title">系友會平台</h1>
            <p className="login-subtitle">色彩與照明科技研究所</p>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>電子郵件</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>

              <div className="form-group">
                <label>密碼</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="請輸入您的密碼"
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                🚪 登入系友會
              </button>
            </form>

            <div className="login-help">
              <p>測試帳號：</p>
              <p>管理員：admin@example.com / admin123</p>
              <p>一般用戶：wang@example.com / password123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主要頁面渲染函數
  const renderHomePage = () => (
    <div className="bounce-in">
      <div className="welcome-message">
        <h1 className="welcome-title">歡迎回到系友大家庭！</h1>
        <p className="welcome-subtitle">歡迎各位系友使用全新的系友會社群平台，一起建立更緊密的連結</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">💼</span>
          <div className="stat-number">{jobs.length}</div>
          <div className="stat-label">本週新職缺</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-number">{events.length}</div>
          <div className="stat-label">即將到來的活動</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-number">{alumni.length}</div>
          <div className="stat-label">活躍系友</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2 className="section-title">
            <span className="section-icon">📢</span>
            最新公告
          </h2>
          {announcements.slice(0, 3).map(announcement => (
            <div key={announcement.id} className={`announcement-item ${announcement.pinned ? 'pinned' : ''}`}>
              <h3 className="item-title">{announcement.title}</h3>
              <p className="item-content">{announcement.content.substring(0, 100)}...</p>
              <div className="item-meta">
                <span className="item-author">{announcement.author}</span>
                <span className="item-date">{announcement.date}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="content-section">
          <h2 className="section-title">
            <span className="section-icon">🎉</span>
            近期活動
          </h2>
          {events.slice(0, 3).map(event => (
            <div key={event.id} className="activity-item">
              <h3 className="item-title">📅 {event.title}</h3>
              <p className="item-content">{event.description.substring(0, 80)}...</p>
              <div className="activity-date">{event.date} {event.time}</div>
              <div className="activity-location">📍 {event.location}</div>
              <div className="item-meta">
                <span className="activity-capacity">{event.registered}/{event.capacity} 已報名</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJobsPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">職缺分享</h1>
        <p className="page-subtitle">發現系友分享的工作機會</p>
        <button className="btn btn-primary" onClick={() => showMessage('職缺發布功能開發中...')}>
          發布職缺
        </button>
      </div>

      {getPendingJobRequests().length > 0 && (
        <div className="requests-section">
          <h3>待處理的交流請求 ({getPendingJobRequests().length})</h3>
          <div className="requests-container">
            {getPendingJobRequests().map(request => (
              <div key={request.id} className="request-card">
                <h4>{request.requesterName} 想要交流職缺</h4>
                <p>{request.message}</p>
                <div className="request-actions">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleJobRequestResponse(request.id, 'approved')}
                  >
                    同意
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleJobRequestResponse(request.id, 'rejected')}
                  >
                    婉拒
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="jobs-container">
        {jobs.map(job => (
          <div key={job.id} className="job-card">
            <h3 className="job-title">{job.title}</h3>
            <div className="job-company">🏢 {job.company}</div>
            
            <div className="job-details">
              <div className="job-detail">
                <span className="job-detail-icon">📍</span>
                {job.location}
              </div>
              <div className="job-detail">
                <span className="job-detail-icon">💰</span>
                {job.salary}
              </div>
              <div className="job-detail">
                <span className="job-detail-icon">👤</span>
                發布者：{job.author}
              </div>
            </div>
            
            <p className="job-description">{job.description}</p>
            
            <div className="job-benefits">
              <h4>福利待遇：</h4>
              <div className="tags">
                {job.benefits.map((benefit, index) => (
                  <span key={index} className="tag benefit-tag">{benefit}</span>
                ))}
              </div>
            </div>
            
            <div className="job-requirements">
              <h4>職位要求：</h4>
              <div className="tags">
                {job.requirements.map((req, index) => (
                  <span key={index} className="tag requirement-tag">{req}</span>
                ))}
              </div>
            </div>
            
            <div className="job-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleJobRequest(job.id)}
              >
                請求交流 ({job.requests})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEventsPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">活動列表</h1>
        <p className="page-subtitle">參與系友會精彩的各類活動</p>
        <button className="btn btn-primary" onClick={() => showMessage('活動建立功能開發中...')}>
          建立活動
        </button>
      </div>

      <div className="jobs-container">
        {events.map(event => (
          <div key={event.id} className="job-card">
            <div className="event-image" style={{
              width: '100%',
              height: '200px',
              backgroundImage: `url(${event.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '15px',
              marginBottom: '1.5rem'
            }}></div>
            
            <h3 className="job-title">📅 {event.title}</h3>
            <div className="job-company" style={{color: '#48dbfb'}}>{event.category}</div>
            
            <div className="job-details">
              <div className="job-detail">
                <span className="job-detail-icon">🗓️</span>
                {event.date} {event.time}
              </div>
              <div className="job-detail">
                <span className="job-detail-icon">📍</span>
                {event.location}
              </div>
              <div className="job-detail">
                <span className="job-detail-icon">👥</span>
                {event.registered}/{event.capacity} 人
              </div>
              <div className="job-detail">
                <span className="job-detail-icon">🏢</span>
                主辦：{event.organizer}
              </div>
            </div>
            
            <p className="job-description">{event.description}</p>
            
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${(event.registered / event.capacity) * 100}%`}}
              ></div>
            </div>
            
            <div className="job-actions">
              <button 
                className={`btn ${event.registered >= event.capacity ? 'btn-disabled' : 'btn-success'}`}
                onClick={() => handleEventRegistration(event.id)}
                disabled={event.registered >= event.capacity}
              >
                {event.registered >= event.capacity ? '已額滿' : '立即報名'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleEventShare(event.id)}
              >
                分享活動
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDirectoryPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">系友名錄</h1>
        <p className="page-subtitle">尋找並聯繫其他系友</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜尋系友姓名、公司或專長..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
          />
          <button className="btn btn-primary" onClick={() => handleSearch(searchTerm)}>
            搜尋
          </button>
        </div>
      </div>

      <div className="alumni-grid">
        {filteredAlumni.map((person, index) => (
          <div key={person.id} className="alumni-card">
            <div className="alumni-avatar" style={{
              background: `linear-gradient(135deg, ${['#667eea', '#ff6b6b', '#48dbfb', '#feca57', '#ff9ff3', '#54a0ff'][index % 6]}, ${['#764ba2', '#feca57', '#0abde3', '#ff6b6b', '#667eea', '#2ed573'][index % 6]})`
            }}>
              {person.name.charAt(0)}
            </div>
            
            <h3 className="alumni-name">{person.name}</h3>
            <div className="alumni-year">{person.year}</div>
            
            <div className="alumni-info">
              <div className="info-item">
                <span className="info-icon">🏢</span>
                {person.company}
              </div>
              <div className="info-item">
                <span className="info-icon">💼</span>
                {person.title}
              </div>
              <div className="info-item">
                <span className="info-icon">📍</span>
                {person.location}
              </div>
              <div className="info-item">
                <span className="info-icon">⏱️</span>
                {person.experience}
              </div>
            </div>
            
            <div className="alumni-skills">
              {person.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill}</span>
              ))}
            </div>
            
            <div className="alumni-stats">
              <div className="stat">
                <span className="stat-number">{person.contacts}</span>
                <span className="stat-label">聯繫</span>
              </div>
              <div className="stat">
                <span className="stat-number">{person.messages}</span>
                <span className="stat-label">訊息</span>
              </div>
            </div>
            
            <div className="alumni-actions">
              <button 
                className="btn btn-primary"
                onClick={() => handleContactAlumni(person.id)}
              >
                聯繫
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleViewProfile(person.id)}
              >
                檔案
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBulletinPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">公佈欄</h1>
        <p className="page-subtitle">系友會最新消息與公告</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜尋公告內容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchTerm)}
          />
          <button className="btn btn-primary" onClick={() => handleSearch(searchTerm)}>
            搜尋
          </button>
        </div>
      </div>

      <div className="bulletin-container">
        {filteredAnnouncements.map(announcement => (
          <div key={announcement.id} className={`bulletin-item ${announcement.pinned ? 'pinned' : ''}`}>
            {announcement.pinned && (
              <div className="pinned-badge">📌 置頂公告</div>
            )}
            
            <div className="bulletin-header">
              <h3 className="bulletin-title">{announcement.title}</h3>
              <span className="bulletin-category">{announcement.category}</span>
            </div>
            
            <p className="bulletin-content">{announcement.content}</p>
            
            <div className="bulletin-meta">
              <div className="bulletin-author">
                <span className="author-icon">👤</span>
                {announcement.author}
              </div>
              <div className="bulletin-date">
                <span className="date-icon">📅</span>
                {announcement.date}
              </div>
            </div>
            
            <div className="bulletin-tags">
              {announcement.tags.map((tag, index) => (
                <span key={index} className="bulletin-tag">{tag}</span>
              ))}
            </div>
            
            <div className="bulletin-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => handleReadMore(announcement.id)}
              >
                閱讀更多
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProfilePage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">個人檔案</h1>
        <p className="page-subtitle">管理您的個人資訊與工作經歷</p>
      </div>

      <div className="profile-container">
        <div className="profile-section">
          <h3>基本資料</h3>
          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>電子郵件</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>畢業年份</label>
                <input
                  type="text"
                  value={userProfile.year}
                  onChange={(e) => setUserProfile({...userProfile, year: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>電話</label>
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>目前公司</label>
                <input
                  type="text"
                  value={userProfile.company}
                  onChange={(e) => setUserProfile({...userProfile, company: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              <div className="form-group">
                <label>職位</label>
                <input
                  type="text"
                  value={userProfile.title}
                  onChange={(e) => setUserProfile({...userProfile, title: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>個人簡介</label>
              <textarea
                value={userProfile.bio}
                onChange={(e) => setUserProfile({...userProfile, bio: e.target.value})}
                disabled={!isEditing}
                rows="3"
              />
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>工作經歷</h3>
          <div className="work-experience">
            {userProfile.workExperience.map(exp => (
              <div key={exp.id} className="experience-item">
                <div className="experience-header">
                  <h4>{exp.position}</h4>
                  <span className="experience-period">
                    {exp.startDate} - {exp.current ? '目前' : exp.endDate}
                  </span>
                </div>
                <div className="experience-company">{exp.company} • {exp.location}</div>
                <p className="experience-description">{exp.description}</p>
                {isEditing && (
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => removeWorkExperience(exp.id)}
                  >
                    刪除
                  </button>
                )}
              </div>
            ))}
            
            {isEditing && (
              <button 
                className="btn btn-secondary"
                onClick={() => showMessage('新增工作經歷功能開發中...')}
              >
                + 新增工作經歷
              </button>
            )}
          </div>
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleEditProfile}>
                編輯檔案
              </button>
              <button className="btn btn-secondary" onClick={handleLinkedInSync}>
                LinkedIn 同步
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-success" onClick={handleSaveProfile}>
                儲存變更
              </button>
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                取消編輯
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderNotificationsPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">通知中心</h1>
        <p className="page-subtitle">查看所有系統通知與訊息</p>
        <button className="btn btn-secondary" onClick={markAllNotificationsAsRead}>
          全部標記為已讀
        </button>
      </div>

      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markNotificationAsRead(notification.id)}
          >
            <div className="notification-icon">
              {notification.type === '職缺' && '💼'}
              {notification.type === '活動' && '📅'}
              {notification.type === '系友' && '👥'}
              {notification.type === '公告' && '📢'}
              {notification.type === '系統' && '⚙️'}
            </div>
            
            <div className="notification-content">
              <h4 className="notification-title">{notification.title}</h4>
              <p className="notification-message">{notification.message}</p>
              <span className="notification-time">{notification.time}</span>
            </div>
            
            {!notification.read && (
              <div className="notification-badge">新</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdminPage = () => (
    <div className="bounce-in">
      <div className="page-header">
        <h1 className="page-title">管理後台</h1>
        <p className="page-subtitle">系統管理與統計資訊</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">註冊系友</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-number">{events.length}</div>
          <div className="stat-label">活動總數</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💼</span>
          <div className="stat-number">{jobs.length}</div>
          <div className="stat-label">職缺總數</div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            資料管理 (CSV 匯入/匯出)
          </h2>
          <div className="admin-actions">
            <button
              className="admin-btn"
              onClick={handleExportUsers}
            >
              📥 匯出系友帳號清單
            </button>
            <button
              className="admin-btn"
              onClick={handleExportJobs}
            >
              📥 匯出職缺清單
            </button>
            <button
              className="admin-btn"
              onClick={handleExportEvents}
            >
              📥 匯出活動清單
            </button>
            <button
              className="admin-btn"
              onClick={handleExportBulletins}
            >
              📥 匯出公告清單
            </button>
            <button
              className="admin-btn"
              onClick={handleExportAll}
            >
              📦 批次匯出所有資料 (ZIP)
            </button>
          </div>
          <div className="admin-actions" style={{marginTop: '1rem'}}>
            <label className="admin-btn" style={{cursor: 'pointer'}}>
              📤 匯入系友帳號清單
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleImportCSV('users', e.target.files[0])}
                style={{display: 'none'}}
              />
            </label>
            <label className="admin-btn" style={{cursor: 'pointer'}}>
              📤 匯入職缺清單
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleImportCSV('jobs', e.target.files[0])}
                style={{display: 'none'}}
              />
            </label>
            <label className="admin-btn" style={{cursor: 'pointer'}}>
              📤 匯入公告清單
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleImportCSV('bulletins', e.target.files[0])}
                style={{display: 'none'}}
              />
            </label>
          </div>
        </div>

        <div className="content-section">
          <h2 className="section-title">
            <span className="section-icon">🔧</span>
            系統設定
          </h2>
          <div className="admin-actions">
            <button
              className="admin-btn"
              onClick={() => showMessage('網站設定功能：\n- 網站標題設定\n- 主題色彩配置\n- 功能模組開關\n- 系統參數調整')}
            >
              🌐 網站設定
            </button>
            <button
              className="admin-btn"
              onClick={() => showMessage('資料備份功能：\n- 自動備份設定\n- 手動備份執行\n- 備份檔案管理\n- 資料還原功能')}
            >
              💾 備份資料
            </button>
          </div>
        </div>

        <div className="content-section">
          <h2 className="section-title">
            <span className="section-icon">👥</span>
            用戶管理
          </h2>
          <div className="admin-actions">
            <button
              className="admin-btn"
              onClick={() => showMessage(`用戶列表：\n${users.map(u => `- ${u.name} (${u.email}) - ${u.role}`).join('\n')}`)}
            >
              📋 用戶列表
            </button>
            <button
              className="admin-btn"
              onClick={() => showMessage('權限設定功能：\n- 角色權限管理\n- 功能存取控制\n- 用戶狀態管理\n- 權限群組設定')}
            >
              🔐 權限設定
            </button>
          </div>
        </div>
      </div>

      <div className="admin-stats">
        <h3>系統統計</h3>
        <div className="stats-details">
          <div className="stat-detail">
            <span>未讀通知：</span>
            <span>{getUnreadNotificationCount()}</span>
          </div>
          <div className="stat-detail">
            <span>待處理請求：</span>
            <span>{getPendingJobRequests().length}</span>
          </div>
          <div className="stat-detail">
            <span>本月新增系友：</span>
            <span>2</span>
          </div>
          <div className="stat-detail">
            <span>本月活動參與：</span>
            <span>{events.reduce((sum, event) => sum + event.registered, 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 主要應用程式介面
  return (
    <div className="app">
      {/* 側邊導航欄 */}
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎨</span>
            <div className="logo-text">
              <div className="logo-title">系友會平台</div>
              <div className="logo-subtitle">色彩與照明科技研究所</div>
            </div>
          </div>
          <div className="user-info">
            <div className="user-name">{currentUser.name}</div>
            <div className="user-year">{currentUser.year}</div>
          </div>
        </div>

        <div className="nav-menu">
          <button 
            className={`nav-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => setCurrentPage('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">首頁</span>
            <span className="nav-badge">1</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'jobs' ? 'active' : ''}`}
            onClick={() => setCurrentPage('jobs')}
          >
            <span className="nav-icon">💼</span>
            <span className="nav-text">職缺分享</span>
            <span className="nav-badge">{getPendingJobRequests().length}</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'events' ? 'active' : ''}`}
            onClick={() => setCurrentPage('events')}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">活動列表</span>
            <span className="nav-badge">{events.length}</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'directory' ? 'active' : ''}`}
            onClick={() => setCurrentPage('directory')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">系友名錄</span>
            <span className="nav-badge">{alumni.length}</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'bulletin' ? 'active' : ''}`}
            onClick={() => setCurrentPage('bulletin')}
          >
            <span className="nav-icon">📢</span>
            <span className="nav-text">公佈欄</span>
            <span className="nav-badge">{announcements.length}</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentPage('profile')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">個人檔案</span>
          </button>

          <button 
            className={`nav-item ${currentPage === 'notifications' ? 'active' : ''}`}
            onClick={() => setCurrentPage('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-text">通知</span>
            <span className="nav-badge">{getUnreadNotificationCount()}</span>
          </button>

          {currentUser.role === 'admin' && (
            <button 
              className={`nav-item ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentPage('admin')}
            >
              <span className="nav-icon">🔧</span>
              <span className="nav-text">管理後台</span>
            </button>
          )}

          <button 
            className="nav-item logout-btn"
            onClick={handleLogout}
          >
            <span className="nav-icon">🚪</span>
            <span className="nav-text">登出</span>
          </button>
        </div>
      </nav>

      {/* 主要內容區域 */}
      <main className="main-content">
        {currentPage === 'home' && renderHomePage()}
        {currentPage === 'jobs' && renderJobsPage()}
        {currentPage === 'events' && renderEventsPage()}
        {currentPage === 'directory' && renderDirectoryPage()}
        {currentPage === 'bulletin' && renderBulletinPage()}
        {currentPage === 'profile' && renderProfilePage()}
        {currentPage === 'notifications' && renderNotificationsPage()}
        {currentPage === 'admin' && renderAdminPage()}
      </main>

      {/* 彈出視窗 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>系統訊息</h3>
            <p style={{whiteSpace: 'pre-line'}}>{modalContent}</p>
            <button className="btn btn-primary" onClick={() => setShowModal(false)}>
              確定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
