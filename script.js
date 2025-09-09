// Sử dụng canvas cho hiệu ứng matrix và morph transition
const body = document.body;
const canvas = document.createElement('canvas');
canvas.id = 'matrix-canvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';
canvas.style.zIndex = '1';
canvas.style.background = 'black';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
body.appendChild(canvas);

// Ẩn các div cũ
matrix.style.display = 'none';
countdown.style.display = 'none';
message.style.display = 'none';

const ctx = canvas.getContext('2d');
// Matrix nền cực dày đặc
const matrixChars = 'HAPPYBIRTHDAY';
const fontSize = 10; // nhỏ hơn nữa
const columns = Math.floor(canvas.width / fontSize) * 2; // gấp đôi số cột
const drops = Array(columns).fill(1);

function drawMatrixRain() {
  ctx.fillStyle = 'rgba(0,0,0,0.10)'; // matrix nền đậm hơn
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = fontSize + 'px monospace';
  ctx.fillStyle = '#b39ddb';
  for (let i = 0; i < drops.length; i++) {
    const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
    ctx.fillText(text, i * fontSize / 2, drops[i] * fontSize);
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.96) {
      drops[i] = 0;
    }
    drops[i] += 1.7; // tốc độ rơi nhanh
  }
}
setInterval(drawMatrixRain, 25); // update nhanh hơn nữa

// Lưu trạng thái điểm chữ cũ để morph gom lại và nở ra
let lastPoints = null;
let lastText = '';

function morphText(targetText, duration = 2200, hold = 1800) {
  return new Promise(resolve => {
    // Tạo các điểm đích theo hình chữ/số lớn
    const points = [];
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const offCtx = off.getContext('2d');
    offCtx.clearRect(0, 0, off.width, off.height);
    // Responsive: giảm font chữ khi trên màn hình nhỏ (điện thoại)
    let fontSize = 120;
    let step = 3;
    let minDim = Math.min(window.innerWidth, window.innerHeight);
    if (minDim < 700) {
      fontSize = Math.floor(minDim / 8); // chữ vừa với cả chiều ngang và dọc
      step = 2;
    }
    offCtx.font = `bold ${fontSize}px monospace`;
    offCtx.textAlign = 'center';
    offCtx.textBaseline = 'middle';
    offCtx.fillStyle = '#fff';
    // Hỗ trợ xuống dòng bằng ký tự '\' hoặc '\n' trong targetText
    const lines = targetText.split(/\\n|\\/);
    const lineHeight = fontSize * 1.1;
    const totalHeight = lines.length * lineHeight;
    for (let i = 0; i < lines.length; i++) {
      offCtx.fillText(lines[i], off.width / 2, off.height / 2 - totalHeight / 2 + i * lineHeight + lineHeight / 2);
    }
    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    // Giảm bước lặp để tăng mật độ điểm (lấp đầy chữ)
    for (let y = 0; y < imgData.height; y += step) {
      for (let x = 0; x < imgData.width; x += step) {
        const idx = (y * imgData.width + x) * 4;
        if (imgData.data[idx + 3] > 128) {
          points.push({ x, y });
        }
      }
    }
    // Morph trực tiếp từ lastPoints sang points
    let fromPoints = lastPoints && lastPoints.length > 0 ? lastPoints : [];
    // Match số lượng điểm
    while (fromPoints.length < points.length) fromPoints.push(fromPoints[Math.floor(Math.random()*fromPoints.length)] || {x:canvas.width/2,y:canvas.height/2});
    while (fromPoints.length > points.length) fromPoints.pop();
    // Tạo ký tự cho từng điểm
    const morphChars = 'HAPPY BIRTH';
    let fromChars = [];
    if (lastText && lastText.length > 0) {
      for (let i = 0; i < fromPoints.length; i++) {
        fromChars.push(morphChars[Math.floor(Math.random() * morphChars.length)]);
      }
    } else {
      for (let i = 0; i < fromPoints.length; i++) {
        fromChars.push(morphChars[Math.floor(Math.random() * morphChars.length)]);
      }
    }
    let toChars = [];
    for (let i = 0; i < points.length; i++) {
      toChars.push(morphChars[Math.floor(Math.random() * morphChars.length)]);
    }
    // Morph trực tiếp
    let progress = 0;
    function animateMorph() {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrixRain();
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let t = Math.min(1, progress / duration);
      for (let i = 0; i < points.length; i++) {
        const x = fromPoints[i].x + (points[i].x - fromPoints[i].x) * t;
        const y = fromPoints[i].y + (points[i].y - fromPoints[i].y) * t;
        let char = t < 0.5 ? fromChars[i] : toChars[i];
        ctx.save();
        ctx.globalAlpha = 0.8 + 0.2 * t;
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#b39ddb';
        ctx.shadowBlur = 10;
        ctx.fillText(char, x, y);
        ctx.restore();
      }
      progress += 30;
      if (progress < duration) {
        requestAnimationFrame(animateMorph);
      } else {
        // Hiệu ứng rung nhẹ khi morph xong
        let holdFrame = 0;
        function holdEffect() {
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawMatrixRain();
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            let char = toChars[i];
            const shake = (Math.random() - 0.5) * 1.2;
            ctx.fillStyle = '#fff';
            ctx.fillText(char, p.x + shake, p.y + shake);
          }
          holdFrame += 1;
          if (holdFrame < hold / 30) {
            requestAnimationFrame(holdEffect);
          } else {
            lastPoints = points;
            lastText = targetText;
            resolve();
          }
        }
        holdEffect();
      }
    }
    animateMorph();
  });
}

// Ngăn tự động chạy hiệu ứng khi chưa bấm nút
window.startSequence = async function() {
  await new Promise(r => setTimeout(r, 800));
  await morphText('3');
  await morphText('2');
  await morphText('1');
  await morphText('Happy\\Birthday');
  await morphText('11.09.2006');
  await morphText('Văn Thúy Hằng');
  await morphText('Happy last\\teen year emju');
  await morphText('Happy last\\teen year emju');
  // Tạo iframe chứa hiệu ứng trái tim
const heartFrame = document.createElement('iframe');
heartFrame.src = 'heart.html'; // File chứa code trái tim
heartFrame.style.position = 'fixed';
heartFrame.style.top = 0;
heartFrame.style.left = 0;
heartFrame.style.width = '100vw';
heartFrame.style.height = '100vh';
heartFrame.style.zIndex = 9999;
heartFrame.style.border = 'none';
document.body.appendChild(heartFrame);

// Hiện dòng chữ "Happy 19+"
const text = document.createElement('div');
text.innerText = 'Happy 19+';
text.style.position = 'fixed';
text.style.top = '50%';
text.style.left = '50%';
text.style.transform = 'translate(-50%, -50%)';
text.style.color = '#fff';
text.style.fontSize = '60px';
text.style.fontWeight = 'bold';
text.style.zIndex = 10000;
text.style.fontFamily = 'cursive';
document.body.appendChild(text);

}

// Responsive: Hướng dẫn xoay ngang trên điện thoại
function showRotateHint() {
  let hint = document.getElementById('rotate-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'rotate-hint';
    hint.style.position = 'fixed';
    hint.style.top = '0';
    hint.style.left = '0';
    hint.style.width = '100vw';
    hint.style.height = '100vh';
    hint.style.background = 'rgba(0,0,0,0.92)';
    hint.style.display = 'flex';
    hint.style.flexDirection = 'column';
    hint.style.alignItems = 'center';
    hint.style.justifyContent = 'center';
    hint.style.zIndex = '9999';
    hint.style.color = '#fff';
    hint.style.fontSize = '2rem';
    hint.style.textAlign = 'center';
    hint.innerHTML = '<div style="font-size:3rem;">🔄</div>Vui lòng xoay ngang điện thoại để trải nghiệm tốt nhất!';
    document.body.appendChild(hint);
  }
  hint.style.display = 'flex';
  // Ẩn nút start-btn khi hiện hint
  var btn = document.getElementById('start-btn');
  if (btn) btn.style.display = 'none';
}
function hideRotateHint() {
  const hint = document.getElementById('rotate-hint');
  if (hint) hint.style.display = 'none';
  // Hiện nút start-btn khi đã xoay ngang
  var btn = document.getElementById('start-btn');
  if (btn) btn.style.display = 'flex';
}
function checkOrientation() {
  if (window.innerHeight > window.innerWidth && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    showRotateHint();
  } else {
    hideRotateHint();
  }
}
window.addEventListener('resize', checkOrientation);
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (window.innerWidth > window.innerHeight && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      location.reload();
    }
  }, 400);
  checkOrientation();
});
window.addEventListener('DOMContentLoaded', checkOrientation);

// Tự động phát nhạc khi mở trang
function playAudioOnStart() {
  let audio = document.getElementById('bg-audio');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'bg-audio';
    audio.src = 'audio/music.mp3'; // Đường dẫn đúng tới file nhạc của bạn
    audio.loop = true;
    audio.autoplay = true;
    audio.style.display = 'none';
    document.body.appendChild(audio);
  }
  // Một số trình duyệt yêu cầu thao tác người dùng mới phát nhạc, thử play()
  audio.play().catch(() => {
    document.body.addEventListener('touchstart', () => audio.play(), { once: true });
    document.body.addEventListener('click', () => audio.play(), { once: true });
  });
}
window.addEventListener('DOMContentLoaded', playAudioOnStart);