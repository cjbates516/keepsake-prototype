// Exercise one customer's selection through a cover-screen / inner-screen transition.
const assert = require('node:assert/strict');
const {chromium, webkit} = require('../../../playwright/node_modules/playwright-core');
const base = process.env.KP_BASE || 'http://127.0.0.1:8766/';

async function check(engine) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({isMobile:true, hasTouch:true, viewport:{width:466,height:678}});
    await page.goto(new URL('signature-golf.html',base).href);
    await page.locator('#andrews .look').nth(2).click();
    await page.waitForFunction(()=>window.__kp && !__kp.printIssue() && __kp.state.variant === 'c2');
    for (const [width,height] of [[890,626],[626,890],[678,466],[466,678]]) {
      await page.setViewportSize({width,height});
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(w=>innerWidth === w,width);
      const state = await page.evaluate(()=>({
        file:__kp.state.photoImg.__kpDesignFile,
        variant:__kp.state.variant,
        width:document.documentElement.scrollWidth,
        canvasBottom:document.querySelector('#stageCanvas').getBoundingClientRect().bottom,
        dockTop:document.querySelector('#orderBar').getBoundingClientRect().top
      }));
      assert.equal(state.file,'kp-golf-st-andrews.jpg');
      assert.equal(state.variant,'c2');
      assert(state.width <= width+1);
      if(width>height) assert(state.canvasBottom <= state.dockTop+1,'case preview extends behind order bar');
    }
    await page.locator('#cartBtn').click();
    await page.locator('#counterReview[open]').waitFor();
    await page.setViewportSize({width:890,height:626});
    await page.locator('#counterReview button').click();
    console.log(engine.name(),'selection and counter review survive fold and rotation');
  } finally {
    await browser.close();
  }
}
(async()=>{for(const engine of [webkit,chromium]) await check(engine);})().catch(err=>{console.error(err);process.exitCode=1;});
