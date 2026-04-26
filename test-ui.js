const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Add listener to catch console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:5173/login');
  
  await page.waitForSelector('[data-testid="button-test-login"]');
  await page.click('[data-testid="button-test-login"]');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const errText = await page.evaluate(() => {
    const errDiv = document.querySelector('.text-red-400');
    return errDiv ? errDiv.textContent : 'No error displayed';
  });
  
  console.log("Error shown on screen:", errText);
  await browser.close();
})();