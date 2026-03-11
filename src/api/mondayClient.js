const API_URL = 'https://api.monday.com/v2';

function validateParams(boardId, groupId, dateColumnId, startDate, endDate) {
  if (!/^\d+$/.test(boardId)) {
    throw new Error(`Invalid boardId: must be numeric`);
  }
  if (!/^[a-zA-Z0-9_]+$/.test(groupId)) {
    throw new Error(`Invalid groupId: must be alphanumeric/underscore`);
  }
  if (!/^[a-zA-Z0-9_]+$/.test(dateColumnId)) {
    throw new Error(`Invalid dateColumnId: must be alphanumeric/underscore`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw new Error(`Invalid startDate: must be YYYY-MM-DD`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error(`Invalid endDate: must be YYYY-MM-DD`);
  }
}

async function mondayQuery(query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.MONDAY_API_TOKEN,
        'API-Version': '2024-10',
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    const json = await res.json();
    if (json.errors) {
      throw new Error(`Monday.com API error: ${JSON.stringify(json.errors)}`);
    }
    return json.data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Monday.com API request timed out after 30 seconds');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseItem(item) {
  const parsed = { name: item.name };
  for (const col of item.column_values) {
    parsed[col.id] = col.text || '';
  }
  return parsed;
}

async function fetchBoardItems(boardId, groupId, dateColumnId, startDate, endDate) {
  validateParams(boardId, groupId, dateColumnId, startDate, endDate);

  const queryParams = `query_params: {rules: [{column_id: "${dateColumnId}", compare_value: ["${startDate}", "${endDate}"], operator: between}]}`;

  // First page
  const firstQuery = `query {
    boards(ids: ${boardId}) {
      groups(ids: "${groupId}") {
        items_page(limit: 500, ${queryParams}) {
          cursor
          items {
            name
            column_values {
              id
              text
            }
          }
        }
      }
    }
  }`;

  const firstData = await mondayQuery(firstQuery);
  const page = firstData.boards[0].groups[0].items_page;
  const allItems = page.items.map(parseItem);
  let cursor = page.cursor;

  // Subsequent pages
  while (cursor) {
    const nextQuery = `query {
      next_items_page(limit: 500, cursor: "${cursor}") {
        cursor
        items {
          name
          column_values {
            id
            text
          }
        }
      }
    }`;

    const nextData = await mondayQuery(nextQuery);
    const nextPage = nextData.next_items_page;
    allItems.push(...nextPage.items.map(parseItem));
    cursor = nextPage.cursor;
  }

  return allItems;
}

module.exports = { fetchBoardItems };
