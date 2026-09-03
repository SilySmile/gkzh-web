<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch"
                 label-width="68px">
            <el-form-item label="问卷标题" prop="surveyTitle">
                <el-input
                    v-model="queryParams.surveyTitle"
                    placeholder="请输入问卷标题"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="用户名称" prop="userName">
                <el-input
                    v-model="queryParams.userName"
                    placeholder="请输入用户名称"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="提交时间" prop="submittedAt">
                <el-date-picker clearable
                                v-model="queryParams.submittedAt"
                                type="date"
                                value-format="yyyy-MM-dd"
                                placeholder="请选择提交时间">
                </el-date-picker>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                    type="danger"
                    plain
                    icon="el-icon-delete"
                    size="mini"
                    :disabled="multiple"
                    @click="handleDelete"
                    v-hasPermi="['wjdc:response:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['wjdc:response:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="responseList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="答卷ID" align="center" prop="responseId"/>
            <el-table-column label="问卷标题" align="center" prop="surveyTitle"/>
            <el-table-column label="用户ID" align="center" prop="userId"/>
            <el-table-column label="用户名" align="center" prop="userName"/>
            <el-table-column label="提交时间" align="center" prop="submittedAt" width="180">
                <template slot-scope="scope">
                    <span>{{ parseTime(scope.row.submittedAt, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-view"
                        @click="handleView(scope.row)"
                        v-hasPermi="['wjdc:response:query']"
                    >查看详情
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['wjdc:response:remove']"
                    >删除
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

        <!-- 查看答卷详情对话框 -->
        <el-dialog title="答卷详情" :visible.sync="detailOpen" width="800px" append-to-body>
            <div v-if="detailData">
                <el-descriptions title="答卷基本信息" :column="2" border>
                    <el-descriptions-item label="答卷ID">{{ detailData.responseId }}</el-descriptions-item>
                    <el-descriptions-item label="问卷标题">{{ detailData.surveyTitle }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ detailData.userId }}</el-descriptions-item>
                    <el-descriptions-item label="用户名">{{ detailData.userName }}</el-descriptions-item>
                    <el-descriptions-item label="提交时间" :span="2">
                        {{ parseTime(detailData.submittedAt, '{y}-{m}-{d} {h}:{i}:{s}') }}
                    </el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">答题详情</el-divider>
                <el-table :data="detailData.answers" border>
                    <el-table-column label="问题标题" prop="questionTitle"/>
                    <el-table-column label="问题类型" prop="questionType" width="100">
                        <template slot-scope="scope">
                            <el-tag v-if="scope.row.questionType === '1'" type="primary">单选题</el-tag>
                            <el-tag v-else-if="scope.row.questionType === '2'" type="success">多选题</el-tag>
                            <el-tag v-else-if="scope.row.questionType === '3'" type="warning">填空题</el-tag>
                            <el-tag v-else-if="scope.row.questionType === '4'" type="info">打分题</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="用户答案" prop="optionText"/>
                </el-table>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {listResponse, delResponse, getResponseDetail} from "@/api/wjdc/response";

export default {
    name: "Response",
    data() {
        return {
            // 遮罩层
            loading: true,
            // 选中数组
            ids: [],
            // 非多个禁用
            multiple: true,
            // 显示搜索条件
            showSearch: true,
            // 总条数
            total: 0,
            // 用户答卷表格数据
            responseList: [],
            // 是否显示详情弹出层
            detailOpen: false,
            // 详情数据
            detailData: null,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                surveyTitle: null,
                userName: null,
                submittedAt: null
            }
        };
    },
    created() {
        this.getList();
    },
    methods: {
        /** 查询用户答卷列表 */
        getList() {
            this.loading = true;
            listResponse(this.queryParams).then(response => {
                this.responseList = response.rows;
                this.total = response.total;
                this.loading = false;
            });
        },
        /** 搜索按钮操作 */
        handleQuery() {
            this.queryParams.pageNum = 1;
            this.getList();
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.resetForm("queryForm");
            this.handleQuery();
        },
        // 多选框选中数据
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.responseId)
            this.multiple = !selection.length
        },
        /** 查看详情按钮操作 */
        handleView(row) {
            getResponseDetail(row.responseId).then(response => {
                this.detailData = response.data;
                this.detailOpen = true;
            });
        },
        /** 删除按钮操作 */
        handleDelete(row) {
            const responseIds = row.responseId || this.ids;
            this.$modal.confirm('是否确认删除用户答卷编号为"' + responseIds + '"的数据项？').then(function () {
                return delResponse(responseIds);
            }).then(() => {
                this.getList();
                this.$modal.msgSuccess("删除成功");
            }).catch(() => {
            });
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('wjdc/response/export', {
                ...this.queryParams
            }, `response_${new Date().getTime()}.xlsx`)
        }
    }
};
</script> 