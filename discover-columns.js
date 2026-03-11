require('dotenv').config();

const boardId = process.argv[2];
if (!boardId) {
  console.error('Usage: node discover-columns.js <boardId>');
  process.exit(1);
}

async function discoverColumns(boardId) {
  const query = `query {
    boards(ids: ${boardId}) {
      name
      columns {
        id
        title
        type
      }
      groups {
        id
        title
      }
    }
  }`;

  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.MONDAY_API_TOKEN,
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query }),
  });

  const { data, errors } = await res.json();
  if (errors) {
    console.error('API errors:', errors);
    process.exit(1);
  }

  const board = data.boards[0];
  console.log(`\nBoard: ${board.name}\n`);

  console.log('Groups:');
  console.log('ID'.padEnd(30), 'Title');
  console.log('-'.repeat(50));
  for (const group of board.groups) {
    console.log(group.id.padEnd(30), group.title);
  }

  console.log('\nColumns:');
  console.log('ID'.padEnd(20), 'Type'.padEnd(20), 'Title');
  console.log('-'.repeat(60));
  for (const col of board.columns) {
    console.log(col.id.padEnd(20), col.type.padEnd(20), col.title);
  }
}

discoverColumns(boardId);
