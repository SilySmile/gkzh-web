<template>
  <div class="app-container game-view" v-loading="loading">
    <el-page-header content="游戏查看" @back="$router.back()" />
    <el-card v-if="view" class="view-card">
      <div slot="header" class="card-header">
        <span>{{ view.gameTitle }}</span>
        <el-button v-if="['mind-window', 'sszctop', 'zycck'].includes(view.viewType)" type="primary" size="small" icon="el-icon-download" @click="exportPdf">导出 PDF</el-button>
      </div>

      <template v-if="view.viewType === 'mind-window'">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="第一页：职业兴趣类型" name="types">
            <div class="type-grid">
              <el-card v-for="item in view.hollandCodes" :key="item.code" shadow="never" class="type-item">
                <div class="type-title"><span class="code-badge">{{ item.code }}</span>{{ item.name }}<span v-if="item.fullName">（{{ item.fullName }}）</span></div>
                <p><b>解释：</b>{{ item.summary || '暂无解释' }}</p>
                <p><b>特征：</b>{{ item.traits || '暂无' }}</p>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="第二页：复合代码统计" name="stats">
            <div class="summary-line">完成用户数：<b>{{ view.totalParticipants || 0 }}</b></div>
            <el-table :data="view.codeStats" border stripe>
              <el-table-column prop="serialNo" label="序号" width="80" align="center" />
              <el-table-column prop="code" label="代码（复合类型代码）" width="220" align="center" />
              <el-table-column prop="codeSummary" label="代码简称（现实型+艺术型+常规型）" min-width="280" />
              <el-table-column prop="userCount" label="人数" width="100" align="center" />
              <el-table-column label="概率" width="120" align="center"><template slot-scope="scope">{{ scope.row.probability }}%</template></el-table-column>
            </el-table>
            <el-empty v-if="!view.codeStats || !view.codeStats.length" description="暂无代码统计数据" />
          </el-tab-pane>
          <el-tab-pane label="第三页：AI 分析" name="analysis">
            <el-alert title="AI 分析说明" type="info" :closable="false" description="分析基于当前游戏已完成用户的复合代码统计自动生成，仅作为活动复盘和生涯指导参考。" />
            <div class="analysis-text">{{ view.analysis || '暂无分析结果' }}</div>
          </el-tab-pane>
        </el-tabs>
      </template>
      <template v-else-if="view.viewType === 'sszctop'">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="第一页：七个维度解释" name="dimensions">
            <div class="dimension-grid">
              <el-card v-for="item in view.dimensions" :key="item.dimensionId" shadow="never" class="dimension-item">
                <div class="dimension-title"><span class="dimension-no">{{ item.sortOrder }}</span>{{ item.name }}</div>
                <p>{{ item.description || '暂无维度解释' }}</p>
              </el-card>
            </div>
          </el-tab-pane>
          <el-tab-pane label="第二页：维度正确率统计" name="stats">
            <div class="summary-line">
              完成用户数：<b>{{ view.totalParticipants || 0 }}</b>
              <span class="summary-separator">整体正确率：<b>{{ view.overallCorrectRate || 0 }}%</b></span>
            </div>
            <el-table :data="view.dimensionStats" border stripe>
              <el-table-column prop="serialNo" label="序号" width="80" align="center" />
              <el-table-column prop="dimensionName" label="职业认知维度" min-width="160" />
              <el-table-column prop="participantCount" label="完成人数" width="110" align="center" />
              <el-table-column prop="correctCount" label="正确人数" width="110" align="center" />
              <el-table-column label="正确率" width="130" align="center">
                <template slot-scope="scope">
                  <el-tag :type="Number(scope.row.correctRate) >= 60 ? 'success' : 'warning'">{{ scope.row.correctRate }}%</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="第三页：简要分析" name="analysis">
            <el-alert title="活动分析说明" type="info" :closable="false" description="分析依据每位学生的独立结算结果生成，用于活动复盘和职业认知辅导参考。" />
            <div class="analysis-text">{{ view.analysis || '暂无分析结果' }}</div>
          </el-tab-pane>
        </el-tabs>
      </template>
      <template v-else-if="view.viewType === 'zycck'">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="参与概览" name="overview">
            <div class="summary-line">
              扫码参与：<b>{{ zycckEnteredCount }}</b>
              <span class="summary-separator">完成探索：<b>{{ zycckFinishedCount }}</b></span>
              <span class="summary-separator">完成率：<b>{{ zycckCompletionRate }}</b></span>
            </div>
            <el-table :data="view.categoryStats || []" border stripe>
              <el-table-column prop="categoryName" label="职业大类" />
              <el-table-column prop="questionCount" label="竞猜题数" width="120" align="center" />
              <el-table-column prop="viewCount" label="浏览次数" width="120" align="center" />
              <el-table-column prop="explorationCount" label="加入清单数" width="130" align="center" />
            </el-table>
            <el-empty v-if="!(view.categoryStats || []).length" description="暂无职业探索统计" />
          </el-tab-pane>
          <el-tab-pane label="用户记录" name="records">
            <el-table :data="view.records || []" border stripe>
              <el-table-column prop="studentName" label="学生" width="120" />
              <el-table-column prop="schoolName" label="学校" min-width="140" />
              <el-table-column prop="departmentName" label="院系" min-width="140" />
              <el-table-column prop="major" label="专业" min-width="120" />
              <el-table-column prop="gender" label="性别" width="70" />
              <el-table-column prop="status" label="状态" width="90" />
            </el-table>
            <el-empty v-if="!(view.records || []).length" description="暂无用户记录" />
          </el-tab-pane>
        </el-tabs>
      </template>
      <el-empty v-else :description="view.message || '该游戏暂未配置查看模板'" />
    </el-card>
  </div>
</template>

<script>
import { getGameView } from '@/api/activity/week'
import { downloadGet } from '@/utils/request'
import { zycckErrorMessage } from '@/api/zycck'

export default {
  name: 'ActivityGameView',
  data() {
    return { loading: false, view: null, activeTab: 'types' }
  },
  computed: {
    zycckEnteredCount() { return Number(this.view && (this.view.enteredCount != null ? this.view.enteredCount : this.view.participating)) || 0 },
    zycckFinishedCount() { return Number(this.view && (this.view.finishedCount != null ? this.view.finishedCount : this.view.finished)) || 0 },
    zycckCompletionRate() { const value = this.view && this.view.completionRate != null ? this.view.completionRate : (this.zycckEnteredCount ? Math.round(this.zycckFinishedCount * 10000 / this.zycckEnteredCount) / 100 : 0); return value + '%' }
  },
  created() { this.loadView() },
  methods: {
    loadView() {
      this.loading = true
      getGameView(this.$route.params.gameId).then(res => {
        this.view = res.data
        this.activeTab = res.data && res.data.viewType === 'sszctop' ? 'dimensions' : (res.data && res.data.viewType === 'zycck' ? 'overview' : 'types')
      }).catch(error => this.$modal.msgError(zycckErrorMessage(error))).finally(() => { this.loading = false })
    },
    exportPdf() {
      downloadGet('/activity/week/game/' + this.$route.params.gameId + '/view/export', {}, '游戏查看报告-' + (this.view && this.view.gameTitle ? this.view.gameTitle : '报告') + '.pdf').catch(error => this.$modal.msgError(zycckErrorMessage(error)))
    }
  }
}
</script>

<style scoped>
.view-card { margin-top: 18px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.type-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.type-item { min-height: 180px; border-left: 4px solid #409eff; }
.type-title { color: #1f2d3d; font-size: 18px; font-weight: 600; margin-bottom: 16px; }
.code-badge { display: inline-block; min-width: 30px; margin-right: 8px; padding: 4px 8px; border-radius: 4px; color: #fff; background: #409eff; text-align: center; }
.type-item p { color: #53657a; line-height: 1.8; margin: 8px 0; }
.summary-line { margin: 4px 0 14px; color: #53657a; }
.analysis-text { margin-top: 24px; padding: 24px 28px; border-radius: 8px; color: #34495e; background: #f5f7fa; font-size: 16px; line-height: 2; white-space: pre-wrap; }
.dimension-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.dimension-item { min-height: 138px; border-left: 4px solid #67c23a; }
.dimension-title { color: #1f2d3d; font-size: 18px; font-weight: 600; margin-bottom: 14px; }
.dimension-no { display: inline-block; min-width: 26px; margin-right: 8px; padding: 3px 7px; border-radius: 50%; color: #fff; background: #67c23a; text-align: center; font-size: 14px; }
.dimension-item p { color: #53657a; line-height: 1.8; margin: 0; }
.summary-separator { margin-left: 28px; }
@media (max-width: 900px) { .type-grid, .dimension-grid { grid-template-columns: 1fr; } }
</style>
