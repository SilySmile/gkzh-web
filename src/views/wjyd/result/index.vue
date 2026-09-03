<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" :inline="true"
                 v-show="showSearch" label-width="68px">
            <el-form-item label="学号" prop="username">
                <el-input
                    v-model="queryParams.username"
                    placeholder="请输入学号"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="姓名" prop="nickname">
                <el-input
                    v-model="queryParams.nickname"
                    placeholder="请输入姓名"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="是否通关" prop="isSuccess">
                <el-select v-model="queryParams.isSuccess"
                           placeholder="请选择是否通关" clearable size="small">
                    <el-option label="失败" value="0"/>
                    <el-option label="成功" value="1"/>
                </el-select>
            </el-form-item>
            <!-- 添加时间范围筛选 -->
            <el-form-item label="创建时间" prop="dateRange">
                <el-date-picker
                    v-model="dateRange"
                    size="small"
                    style="width: 240px"
                    value-format="yyyy-MM-dd HH:mm:ss"
                    type="datetimerange"
                    range-separator="-"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    clearable
                ></el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini"
                           @click="handleQuery">搜索
                </el-button>
                <el-button icon="el-icon-refresh" size="mini"
                           @click="resetQuery">重置
                </el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['wjyd:result:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch"
                           @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="resultList"
                  @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="记录ID" align="center" prop="id"/>
            <el-table-column label="学号" align="center" prop="username" />
            <el-table-column label="姓名" align="center" prop="nickname" />
            <el-table-column label="通关状态" align="center" prop="isSuccess">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.is_success"
                              :value="String(scope.row.isSuccess)"/>
                </template>
            </el-table-column>
            <el-table-column label="创建时间" align="center" prop="createTime"
                             width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center"
                             class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-view"
                        @click="handleView(scope.row)"
                        v-hasPermi="['wjyd:result:query']"
                    >详情
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
        />

        <!-- 答题详情对话框 -->
        <el-dialog :title="detailTitle" :visible.sync="openDetail" width="800px"
                   append-to-body>
            <el-table :data="answerDetails" v-loading="detailLoading">
                <el-table-column label="题目内容" prop="questionText"
                                 show-overflow-tooltip/>
                <el-table-column label="用户答案" prop="userAnswer" width="80">
                    <template slot-scope="scope">
                        <span
                            :style="{ color: scope.row.isCorrect ? '#67C23A' : '#F56C6C' }">{{
                                scope.row.userAnswer
                            }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="是否正确" prop="isCorrect" width="80">
                    <template slot-scope="scope">
                        <dict-tag :options="dict.type.is_correct_status"
                                  :value="scope.row.isCorrect"/>
                    </template>
                </el-table-column>
            </el-table>
            <div slot="footer" class="dialog-footer">
                <el-button @click="openDetail = false">关 闭</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {listResult, getResultDetails,exportResult} from "@/api/wjyd/result";

export default {
    name: "AnswerResult",
    dicts: ['is_success', 'is_correct_status'],
    data() {
        return {
            // 遮罩层
            loading: true,
            // 详情遮罩层
            detailLoading: false,
            // 显示搜索条件
            showSearch: true,
            // 答题结果表格数据
            resultList: [],
            // 答题详情数据
            answerDetails: [],
            // 答题详情标题
            detailTitle: "",
            // 是否显示详情弹出层
            openDetail: false,
            // 总条数
            total: 0,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                userId: null,
                isSuccess: null,
                startTime: null,
                endTime: null
            },
            // 添加时间范围参数
            dateRange: [],
            // 选中数组
            ids: []
        };
    },
    created() {
        this.getList();
    },
    methods: {
        /** 查询答题结果列表 */
        getList() {
            this.loading = true;
            listResult(this.queryParams).then(response => {
                this.resultList = response.rows;
                this.total = response.total;
                this.loading = false;
            });
        },
        /** 搜索按钮操作 */
        handleQuery() {
            this.queryParams.pageNum = 1;
            if (this.dateRange && this.dateRange.length === 2) {
                this.queryParams.startTime = this.dateRange[0];
                this.queryParams.endTime = this.dateRange[1];
            } else {
                this.queryParams.startTime = null;
                this.queryParams.endTime = null;
            }
            this.getList();
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.resetForm("queryForm");
            this.dateRange = [];
            this.handleQuery();
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('answer/result/exportUserAnswerRecords' ,this.queryParams,
                `参与记录信息_${new Date().getTime()}.xlsx`);
        },
        /** 多选框选中数据 */
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.id)
        },
        /** 查看详情 */
        handleView(row) {
            this.detailLoading = true;
            this.openDetail = true;
            this.detailTitle = "答题详情";
            getResultDetails(row.id).then(response => {
                this.answerDetails = response.data;
                this.detailLoading = false;
            });
        }
    }
};
</script>
