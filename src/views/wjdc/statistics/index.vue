<template>
    <div class="app-container">
        <el-row :gutter="20">
            <!-- 问卷选择 -->
            <el-col :span="8">
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>问卷选择</span>
                    </div>
                    <el-form :model="queryParams" ref="queryForm" label-width="80px">
                        <el-form-item label="选择问卷">
                            <el-select v-model="queryParams.surveyId" placeholder="请选择问卷"
                                       @change="handleSurveyChange" clearable>
                                <el-option
                                    v-for="item in surveyList"
                                    :key="item.id"
                                    :label="item.title"
                                    :value="item.id">
                                </el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item>
                            <el-button type="primary" @click="loadSurveyStatistics">查看统计</el-button>
                        </el-form-item>
                    </el-form>
                </el-card>
            </el-col>

            <!-- 问卷概览 -->
            <el-col :span="16">
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>问卷概览</span>
                    </div>
                    <el-row :gutter="20" v-if="surveyOverview">
                        <el-col :span="8">
                            <div class="stat-item">
                                <div class="stat-number">{{ surveyOverview.totalResponses || 0 }}</div>
                                <div class="stat-label">总答卷数</div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="stat-item">
                                <div class="stat-number">{{ questionCount }}</div>
                                <div class="stat-label">问题数量</div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="stat-item">
                                <div class="stat-number">{{ todayResponses }}</div>
                                <div class="stat-label">今日答卷</div>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>
            </el-col>
        </el-row>

        <!-- 问题统计 -->
        <el-card class="box-card" style="margin-top: 20px;">
            <div slot="header" class="clearfix">
                <span>问题统计</span>
                <el-button style="float: right; padding: 3px 0" type="text" @click="exportStatistics">导出统计
                </el-button>
            </div>

            <el-table v-loading="loading" :data="questionStatistics" border>
                <el-table-column label="问题标题" prop="questionTitle"/>
                <el-table-column label="问题类型" prop="questionType" width="120">
                    <template slot-scope="scope">
                        <el-tag v-if="scope.row.questionType === '1'" type="primary">单选题</el-tag>
                        <el-tag v-else-if="scope.row.questionType === '2'" type="success">多选题</el-tag>
                        <el-tag v-else-if="scope.row.questionType === '3'" type="warning">填空题</el-tag>
                        <el-tag v-else-if="scope.row.questionType === '4'" type="info">打分题</el-tag>
                        <el-tag v-else-if="scope.row.questionType === '5'" type="info">选项打分题</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="答卷数量" prop="totalResponses" width="100"/>
                <el-table-column label="操作" width="150" align="center">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            type="text"
                            @click="viewQuestionDetail(scope.row)"
                        >查看详情
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <!-- 问题详情对话框 -->
        <el-dialog title="问题统计详情" :visible.sync="questionDetailOpen" width="800px" append-to-body>
            <div v-if="currentQuestion">
                <h3>{{ currentQuestion.questionTitle }}</h3>
                <p>问题类型：{{ getQuestionTypeName(currentQuestion.questionType) }}</p>

                <!-- 选择题统计 -->
                <div v-if="currentQuestion.questionType === '1' || currentQuestion.questionType === '2'">
                    <el-table :data="optionStatistics" border>
                        <el-table-column label="选项内容" prop="optionText"/>
                        <el-table-column label="选择次数" prop="selectCount" width="100"/>
                        <el-table-column label="选择比例" prop="selectPercentage" width="100"/>
                    </el-table>
                </div>

                <!-- 填空题统计 -->
                <div v-else-if="currentQuestion.questionType === '3' || currentQuestion.questionType === '4'">
                    <el-table :data="answerStatistics" border>
                        <el-table-column label="答案内容" prop="answerText"/>
                        <el-table-column label="出现次数" prop="answerCount" width="100"/>
                    </el-table>
                </div>
                <!-- 选项打分题统计 -->
                <div v-else-if="currentQuestion.questionType === '5'">
                    <el-table :data="scoreOptionStatistics" border>
                        <el-table-column label="选项内容" prop="optionText"/>
                        <el-table-column label="平均分数" prop="averageScore" width="120">
                            <template slot-scope="scope">
                                {{ scope.row.averageScore !== null ? scope.row.averageScore.toFixed(2) : '0.00' }}
                            </template>
                        </el-table-column>
                        <el-table-column label="标准差" prop="standardDeviation" width="120">
                            <template slot-scope="scope">
                                {{ scope.row.standardDeviation !== null ? scope.row.standardDeviation.toFixed(2) : '0.00' }}
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {
    getSurveyResponseCount,
    getSurveyQuestionStatistics,
    getQuestionOptionStatistics,
    getQuestionAnswerStatistics,
    getQuestionScoreOptionStatistics
} from "@/api/wjdc/statistics";
import {listSurvey} from "@/api/wjdc/survey";

export default {
    name: "Statistics",
    data() {
        return {
            // 遮罩层
            loading: false,
            // 查询参数
            queryParams: {
                surveyId: null
            },
            // 问卷列表
            surveyList: [],
            // 问卷概览
            surveyOverview: null,
            // 问题数量
            questionCount: 0,
            // 今日答卷数
            todayResponses: 0,
            // 问题统计
            questionStatistics: [],
            // 问题详情对话框
            questionDetailOpen: false,
            // 当前问题
            currentQuestion: null,
            // 选项统计
            optionStatistics: [],
            // 答案统计
            answerStatistics: [],
            // 添加一个新的数据属性用于存储选项打分题统计
            scoreOptionStatistics: []
        };
    },
    created() {
        this.loadSurveyList();
        // this.loadSurveyCount();
    },
    methods: {
        /** 加载问卷列表 */
        loadSurveyList() {
            listSurvey({}).then(response => {
                this.surveyList = response.rows;
            });
        },

        /** 加载问卷答卷数量统计 */
        // loadSurveyCount() {
        //   getSurveyResponseCount().then(response => {
        //     this.surveyList = response.data;
        //   });
        // },

        /** 问卷选择变化 */
        handleSurveyChange(surveyId) {
            if (surveyId) {
                this.loadSurveyStatistics();
            } else {
                this.surveyOverview = null;
                this.questionStatistics = [];
            }
        },

        /** 加载问卷统计 */
        loadSurveyStatistics() {
            if (!this.queryParams.surveyId) {
                this.$modal.msgWarning("请先选择问卷");
                return;
            }

            this.loading = true;
            getSurveyQuestionStatistics(this.queryParams.surveyId).then(response => {
                this.questionStatistics = response.data;
                this.questionCount = this.questionStatistics.length;

                // 计算今日答卷数（这里简化处理，实际应该根据时间筛选）
                this.todayResponses = this.questionStatistics.length > 0 ? this.questionStatistics[0].totalResponses : 0;

                // 设置问卷概览
                this.surveyOverview = {
                    totalResponses: this.questionStatistics.length > 0 ? this.questionStatistics[0].totalResponses : 0
                };

                this.loading = false;
            });
        },

        /** 查看问题详情 */
        viewQuestionDetail(question) {
            this.currentQuestion = question;
            this.questionDetailOpen = true;

            // 使用 $nextTick 确保 DOM 更新后再加载数据
            this.$nextTick(() => {
                if (question.questionType === '1' || question.questionType === '2') {
                    // 加载选项统计
                    getQuestionOptionStatistics(question.questionId).then(response => {
                        this.optionStatistics = response.data;
                    });
                } else if (question.questionType === '3' || question.questionType === '4') {
                    // 加载答案统计
                    getQuestionAnswerStatistics(question.questionId).then(response => {
                        this.answerStatistics = response.data;
                    });
                } else if (question.questionType === '5') {
                    // 加载选项打分题统计
                    getQuestionScoreOptionStatistics(question.questionId).then(response => {
                        this.scoreOptionStatistics = response.data;
                    });
                }
            });
        },


        /** 获取问题类型名称 */
        getQuestionTypeName(type) {
            const typeMap = {
                '1': '单选题',
                '2': '多选题',
                '3': '填空题',
                '4': '打分题',
                '5': '选项打分题'
            };
            return typeMap[type] || '未知类型';
        },

        /** 导出统计 */
        exportStatistics() {
            if (!this.queryParams.surveyId) {
                this.$modal.msgWarning("请先选择问卷");
                return;
            }

            this.download('wjdc/statistics/export/' + this.queryParams.surveyId, {},
                `统计信息_${new Date().getTime()}.xlsx`);
        }
    }
};
</script>

<style scoped>
.stat-item {
    text-align: center;
    padding: 20px;
}

.stat-number {
    font-size: 24px;
    font-weight: bold;
    color: #409EFF;
    margin-bottom: 10px;
}

.stat-label {
    font-size: 14px;
    color: #666;
}
</style>
