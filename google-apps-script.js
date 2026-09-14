// ============================================================
// Google Apps Script — Calendar + Weather Proxy
// ============================================================
// DEPLOY THIS AS A WEB APP:
// 1. Go to https://script.google.com
// 2. Create a new project, paste this code
// 3. Click Deploy > New Deployment
// 4. Type: Web App
// 5. Execute as: Me
// 6. Who has access: Anyone
// 7. Click Deploy, copy the URL
// 8. Paste the URL into index.html CONFIG.proxyUrl
// ============================================================

function doGet(e) {
  const action = e.parameter.action || 'events';
  let result;

  if (action === 'events') {
    result = getEvents(e.parameter.month);
  } else if (action === 'news') {
    result = getNews();
  } else {
    result = { error: 'Unknown action' };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getEvents(monthParam) {
  const now = new Date();
  let rangeStart, rangeEnd;

  if (monthParam === 'full') {
    // Full month range for monthly calendar view
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    // Today only
    rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 1);
  }

  // Your calendars + Ruth's calendar
  const calendars = CalendarApp.getAllCalendars();
  const ruthCal = CalendarApp.getCalendarById('ruthielett@gmail.com');
  if (ruthCal) {
    // Check it's not already in the list
    const ids = calendars.map(c => c.getId());
    if (ids.indexOf('ruthielett@gmail.com') === -1) {
      calendars.push(ruthCal);
    }
  }

  const allEvents = [];

  for (const cal of calendars) {
    try {
      const events = cal.getEvents(rangeStart, rangeEnd);
      for (const ev of events) {
        allEvents.push({
          summary: ev.getTitle(),
          location: ev.getLocation() || null,
          start: {
            dateTime: ev.isAllDayEvent() ? null : ev.getStartTime().toISOString(),
            date: ev.isAllDayEvent() ? ev.getStartTime().toISOString().split('T')[0] : null,
          },
          end: {
            dateTime: ev.isAllDayEvent() ? null : ev.getEndTime().toISOString(),
            date: ev.isAllDayEvent() ? ev.getEndTime().toISOString().split('T')[0] : null,
          },
          calendarName: cal.getName(),
          color: ev.getColor() || null,
          isRuth: cal.getId() === 'ruthielett@gmail.com',
        });
      }
    } catch (e) {
      // Skip calendars we can't access
    }
  }

  // Sort by start time (all-day first, then by time)
  allEvents.sort((a, b) => {
    const aTime = a.start.dateTime || a.start.date || '';
    const bTime = b.start.dateTime || b.start.date || '';
    if (!a.start.dateTime && b.start.dateTime) return -1;
    if (a.start.dateTime && !b.start.dateTime) return 1;
    return aTime.localeCompare(bTime);
  });

  return {
    events: allEvents,
    updated: new Date().toISOString(),
    timezone: Session.getScriptTimeZone(),
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

function getNews() {
  const feeds = [
    'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
  ];

  const articles = [];

  for (const feedUrl of feeds) {
    try {
      const resp = UrlFetchApp.fetch(feedUrl, { muteHttpExceptions: true });
      const xml = XmlService.parse(resp.getContentText());
      const root = xml.getRootElement();
      const ns = root.getNamespace();
      const channel = root.getChild('channel', ns) || root.getChild('channel');
      if (!channel) continue;

      const items = channel.getChildren('item', ns) || channel.getChildren('item');
      const sourceName = (channel.getChildText('title', ns) || channel.getChildText('title') || '').replace(' - RSS', '');

      for (let i = 0; i < Math.min(items.length, 10); i++) {
        const item = items[i];
        articles.push({
          title: item.getChildText('title', ns) || item.getChildText('title') || '',
          source: sourceName,
          pubDate: item.getChildText('pubDate', ns) || item.getChildText('pubDate') || '',
        });
      }
    } catch (e) {
      // Skip failed feeds
    }
  }

  // Shuffle so it's not all one source in a row
  for (let i = articles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [articles[i], articles[j]] = [articles[j], articles[i]];
  }

  return {
    articles: articles,
    updated: new Date().toISOString(),
  };
}
