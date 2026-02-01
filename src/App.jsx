import { useState, useEffect } from 'react'
import './App.css'

// 奖品配置
const PRIZES = [
  { level: 1, name: '苹果手机', emoji: '📱', count: 2 },
  { level: 2, name: '自行车', emoji: '🚲', count: 5 },
  { level: 3, name: '抱枕', emoji: '🧸', count: 10 }
]

// 默认概率
const DEFAULT_PROBABILITIES = {
  1: 0.01,  // 1%
  2: 0.02,  // 1/50 = 2%
  3: 0.10   // 1/10 = 10%
}

function App() {
  const [winners, setWinners] = useState([])
  const [probabilities, setProbabilities] = useState(DEFAULT_PROBABILITIES)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [probInputs, setProbInputs] = useState({
    1: '1%',
    2: '1/50',
    3: '1/10'
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedWinners = localStorage.getItem('lotteryWinners')
    const savedProb = localStorage.getItem('lotteryProbabilities')
    
    if (savedWinners) {
      setWinners(JSON.parse(savedWinners))
    }
    if (savedProb) {
      const prob = JSON.parse(savedProb)
      setProbabilities(prob)
      setProbInputs({
        1: formatProbDisplay(prob[1]),
        2: formatProbDisplay(prob[2]),
        3: formatProbDisplay(prob[3])
      })
    }
  }, [])

  // 格式化概率显示
  const formatProbDisplay = (prob) => {
    if (prob < 0.5) {
      return `${(prob * 100).toFixed(0)}%`
    }
    return prob.toString()
  }

  // 解析概率输入
  const parseProb = (str) => {
    str = str.trim()
    
    if (str.includes('%')) {
      const num = parseFloat(str.replace('%', ''))
      if (!isNaN(num)) return num / 100
    }
    
    if (str.includes('/')) {
      const parts = str.split('/')
      if (parts.length === 2) {
        const num = parseFloat(parts[0])
        const denom = parseFloat(parts[1])
        if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
          return num / denom
        }
      }
    }
    
    const num = parseFloat(str)
    if (!isNaN(num)) {
      if (num > 1) return num / 100
      return num
    }
    
    return 0.01
  }

  // 获取剩余奖品数量
  const getRemaining = (level) => {
    const won = winners.filter(w => w.level === level).length
    const prize = PRIZES.find(p => p.level === level)
    return prize.count - won
  }

  // 检查是否还有奖品
  const hasRemainingPrizes = () => {
    return PRIZES.some(p => getRemaining(p.level) > 0)
  }

  // 抽奖
  const drawLottery = () => {
    if (!hasRemainingPrizes()) {
      setResult({
        success: false,
        message: '奖品已全部抽完！'
      })
      return
    }

    setLoading(true)
    setResult(null)

    setTimeout(() => {
      // 检查剩余奖品
      const remainingPrizes = PRIZES.filter(p => getRemaining(p.level) > 0)
      
      if (remainingPrizes.length === 0) {
        setResult({
          success: false,
          message: '奖品已全部抽完！'
        })
        setLoading(false)
        return
      }

      // 根据概率随机抽取
      const random = Math.random()
      let cumulativeProb = 0
      let selectedLevel = null

      for (const level of remainingPrizes.map(p => p.level)) {
        cumulativeProb += probabilities[level]
        if (random < cumulativeProb) {
          selectedLevel = level
          break
        }
      }

      const totalProb = probabilities[1] + probabilities[2] + probabilities[3]
      
      if (selectedLevel === null || random >= totalProb) {
        setResult({
          success: false,
          message: '😢 再接再厉，没有中奖！'
        })
        setLoading(false)
        return
      }

      // 中奖！
      const winner = {
        level: selectedLevel,
        time: new Date().toLocaleString('zh-CN')
      }
      
      const newWinners = [...winners, winner]
      setWinners(newWinners)
      localStorage.setItem('lotteryWinners', JSON.stringify(newWinners))
      
      const prize = PRIZES.find(p => p.level === selectedLevel)
      setResult({
        success: true,
        prize
      })
      
      setLoading(false)
      launchConfetti()
    }, 1000)
  }

  // 重置抽奖
  const resetLottery = () => {
    if (window.confirm('确定要重置抽奖吗？所有中奖记录将被清除！')) {
      setWinners([])
      localStorage.setItem('lotteryWinners', '[]')
      setResult(null)
    }
  }

  // 保存概率设置
  const saveProbabilities = () => {
    const newProb = {
      1: parseProb(probInputs[1]),
      2: parseProb(probInputs[2]),
      3: parseProb(probInputs[3])
    }
    
    setProbabilities(newProb)
    localStorage.setItem('lotteryProbabilities', JSON.stringify(newProb))
    alert('✅ 概率设置已保存！')
  }

  // 庆祝彩带
  const launchConfetti = () => {
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
    const container = document.getElementById('confetti')
    
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div')
      confetti.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: fall ${2 + Math.random() * 2}s linear forwards;
      `
      container.appendChild(confetti)
    }

    setTimeout(() => {
      container.innerHTML = ''
    }, 4000)
  }

  return (
    <div className="app">
      <div id="confetti" className="confetti"></div>
      
      <div className="container">
        <h1>🎰 幸运抽奖</h1>
        <p className="subtitle">React 版本</p>
        
        {/* 状态栏 */}
        <div className="status-bar">
          <span className="status-item">🎁 总奖品: 17份</span>
          <span className="status-item">📦 剩余: {PRIZES.reduce((sum, p) => sum + getRemaining(p.level), 0)}份</span>
          <span className="status-item">👥 已参与: {winners.length}人</span>
        </div>
        
        {/* 奖品展示 */}
        <div className="prize-section">
          <h2>🎯 奖品池</h2>
          <div className="prize-grid">
            {PRIZES.map(prize => (
              <div key={prize.level} className="prize-card">
                <div className="prize-emoji">{prize.emoji}</div>
                <div className="prize-name">{prize.name}</div>
                <div className={`prize-remaining ${getRemaining(prize.level) === 0 ? 'empty' : ''}`}>
                  剩余 {getRemaining(prize.level)} {prize.level === 1 ? '台' : prize.level === 2 ? '辆' : '个'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 概率设置 */}
        <div className={`settings-panel ${settingsVisible ? 'show' : ''}`}>
          <h3>⚙️ 中奖概率设置</h3>
          <div className="setting-row">
            <label>🥇 1等奖概率：</label>
            <input 
              type="text" 
              value={probInputs[1]}
              onChange={(e) => setProbInputs({...probInputs, 1: e.target.value})}
              placeholder="1% 或 1/100"
            />
          </div>
          <div className="setting-row">
            <label>🥈 2等奖概率：</label>
            <input 
              type="text" 
              value={probInputs[2]}
              onChange={(e) => setProbInputs({...probInputs, 2: e.target.value})}
              placeholder="2% 或 1/50"
            />
          </div>
          <div className="setting-row">
            <label>🥉 3等奖概率：</label>
            <input 
              type="text" 
              value={probInputs[3]}
              onChange={(e) => setProbInputs({...probInputs, 3: e.target.value})}
              placeholder="10% 或 1/10"
            />
          </div>
          <button className="btn btn-save" onClick={saveProbabilities}>
            💾 保存设置
          </button>
          <div className="prob-info">
            当前总中奖概率：{((probabilities[1] + probabilities[2] + probabilities[3]) * 100).toFixed(2)}%
            (1等奖{(probabilities[1] * 100).toFixed(0)}% + 2等奖{(probabilities[2] * 100).toFixed(0)}% + 3等奖{(probabilities[3] * 100).toFixed(0)}%)
          </div>
        </div>
        
        {/* 按钮区 */}
        <div className="btn-section">
          <button 
            className="btn btn-draw" 
            onClick={drawLottery}
            disabled={!hasRemainingPrizes() || loading}
          >
            {loading ? '🎰 抽奖中...' : '🎰 开始抽奖'}
          </button>
          <button className="btn btn-reset" onClick={resetLottery}>
            🔄 重置
          </button>
          <button className="btn btn-toggle" onClick={() => setSettingsVisible(!settingsVisible)}>
            ⚙️ 概率
          </button>
        </div>
        
        {/* 结果展示 */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <div>正在抽奖中...</div>
          </div>
        )}
        
        {result && (
          <div className={`result-box ${result.success ? 'win' : 'lose'}`}>
            <div className="result-emoji">{result.success ? result.prize.emoji : '😢'}</div>
            <div className="result-title">{result.success ? '🎉 恭喜中奖！' : '😢 再接再厉'}</div>
            <div className="result-prize">
              {result.success ? result.prize.name : result.message}
            </div>
          </div>
        )}
        
        {/* 中奖记录 */}
        <div className="winners-section">
          <h3>🏆 中奖记录</h3>
          {winners.length === 0 ? (
            <div className="no-winners">暂无中奖记录</div>
          ) : (
            <div className="winners-list">
              {winners.map((w, i) => {
                const prize = PRIZES.find(p => p.level === w.level)
                return (
                  <div key={i} className="winner-item">
                    <div className="winner-index">{i + 1}</div>
                    <div className="winner-info">
                      <div className="winner-prize">{prize?.emoji} {prize?.name}</div>
                      <div className="winner-time">{w.time}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
