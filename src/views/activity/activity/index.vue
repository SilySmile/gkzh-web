<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small"
                 :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="活动名称" prop="title">
                <el-input
                    v-model="queryParams.title"
                    placeholder="请输入活动名称"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <!--      <el-form-item label="开始时间" prop="startTime">-->
            <!--        <el-date-picker-->
            <!--          v-model="queryParams.startTime"-->
            <!--          type="datetimerange"-->
            <!--          :picker-options="pickerOptions"-->
            <!--          range-separator="至"-->
            <!--          start-placeholder="开始"-->
            <!--          end-placeholder="结束"-->
            <!--          align="right">-->
            <!--        </el-date-picker>-->
            <!--      </el-form-item>-->
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
                    type="primary"
                    plain
                    icon="el-icon-plus"
                    size="mini"
                    @click="handleAdd"
                    v-hasPermi="['activity:activity:add']"
                >新增
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="success"
                    plain
                    icon="el-icon-edit"
                    size="mini"
                    :disabled="single"
                    @click="handleUpdate"
                    v-hasPermi="['activity:activity:edit']"
                >修改
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="danger"
                    plain
                    icon="el-icon-delete"
                    size="mini"
                    :disabled="multiple"
                    @click="handleDelete"
                    v-hasPermi="['activity:activity:remove']"
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
                    v-hasPermi="['activity:activity:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch"
                           @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="activityList"
                  @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="活动ID" align="center" prop="activityId"/>
            <el-table-column label="活动名称" align="center" prop="title"/>
            <el-table-column label="活动开始时间" align="center"
                             prop="startTime" width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.startTime, '{y}-{m}-{d}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column label="活动结束时间" align="center" prop="endTime"
                             width="180">
                <template slot-scope="scope">
                    <span>{{
                            parseTime(scope.row.endTime, '{y}-{m}-{d}')
                        }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.activity_normal_disable"
                              :value="scope.row.status"/>
                </template>
            </el-table-column>
            <el-table-column label="活动关卡配置" align="center">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="primary"
                        icon="el-icon-setting"
                        @click="handleConfigModules(scope.row)"
                        v-hasPermi="['activity:activity:edit']"
                    >配置关卡
                    </el-button>
                </template>
            </el-table-column>
            <!--      <el-table-column label="参与人配置" align="center">
                    <template slot-scope="scope">
                      <el-button
                        size="mini"
                        type="primary"
                        icon="el-icon-setting"
                        @click="handleConfigParticipants(scope.row)"
                        v-hasPermi="['activity:activity:edit']"
                      >配置参与人</el-button>
                      <div v-if="scope.row.participantConfig" class="participant-summary">
                        <el-tag size="mini" type="info">
                          {{ getParticipantSummary(scope.row.participantConfig) }}
                        </el-tag>
                      </div>
                    </template>
                  </el-table-column>-->
            <el-table-column label="操作" align="center"
                             class-name="small-padding fixed-width">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-document-copy"
                        @click="handleCopy(scope.row)"
                        v-hasPermi="['activity:activity:add']"
                    >复制
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-edit"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['activity:activity:edit']"
                    >修改
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-view"
                        @click="handlePreviewQRCode(scope.row)"
                        v-hasPermi="['activity:activity:query']"
                    >预览二维码
                    </el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['activity:activity:remove']"
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

        <!-- 添加或修改活动举办对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="800px"
                   append-to-body>
            <el-form ref="form" :model="form" :rules="rules"
                     label-width="120px">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="活动名称" prop="title">
                            <el-input v-model="form.title"
                                      placeholder="请输入活动名称"/>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="活动地点" prop="location">
                            <el-input v-model="form.location"
                                      placeholder="请输入活动地点"/>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="活动开始时间" prop="startTime">
                            <el-date-picker clearable
                                            v-model="form.startTime"
                                            type="date"
                                            value-format="yyyy-MM-dd"
                                            placeholder="请选择活动开始时间"
                                            style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="活动结束时间" prop="endTime">
                            <el-date-picker clearable
                                            v-model="form.endTime"
                                            value-format="yyyy-MM-dd"
                                            type="date"
                                            placeholder="请选择活动结束时间"
                                            style="width: 100%">
                            </el-date-picker>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="活动主办方" prop="organizer">
                            <el-select
                                v-model="form.organizer"
                                placeholder="请选择活动主办方"
                                clearable
                                filterable
                            >
                                <el-option
                                    v-for="school in schoolList"
                                    :key="school.schoolId"
                                    :label="school.title"
                                    :value="String(school.schoolId)">
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>

                    <el-col :span="12">
                        <el-form-item label="活动协办方" prop="coOrganizer">
                            <el-input v-model="form.coOrganizer"
                                      placeholder="请输入活动协办方"/>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="活动联系人" prop="contactPerson">
                            <el-input v-model="form.contactPerson"
                                      placeholder="请输入活动联系人"/>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="联系电话" prop="contactPhone">
                            <el-input v-model="form.contactPhone"
                                      placeholder="请输入联系电话"/>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-form-item label="活动描述" prop="description">
                        <el-input v-model="form.description" type="textarea"
                                  placeholder="请输入内容"/>
                    </el-form-item>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="状态">
                            <el-radio-group v-model="form.status">
                                <el-radio
                                    v-for="dict in dict.type.activity_normal_disable"
                                    :key="dict.value" :label="dict.value">
                                    {{ dict.label }}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="备注" prop="remark">
                            <el-input v-model="form.remark" type="textarea"
                                      placeholder="请输入内容"/>
                        </el-form-item>
                    </el-col>
                </el-row>

            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitForm">确 定</el-button>
                <el-button @click="cancel">取 消</el-button>
            </div>
        </el-dialog>

        <!-- 参与人配置弹窗 -->
        <participant-config-dialog
            :visible.sync="participantConfigVisible"
            :activity-data="currentActivity"
            @confirm="handleParticipantConfigConfirm"
        />

        <!-- 环节配置弹窗 -->
        <module-config-dialog
            :visible.sync="moduleConfigVisible"
            :activity-data="currentActivity"
            @confirm="handleModuleConfigConfirm"
        />

    </div>
</template>

<script>
import {
    listActivity,
    getActivity,
    delActivity,
    addActivity,
    updateActivity,
    copyActivity
} from "@/api/activity/activity"
import { listSchool } from "@/api/school/school"
import ParticipantConfigDialog from './ParticipantConfigDialog.vue'
import ModuleConfigDialog from './ModuleConfigDialog.vue'


export default {
    name: "Activity",
    dicts: ['activity_normal_disable'],
    components: {
        ParticipantConfigDialog,
        ModuleConfigDialog
    },
    data() {
        return {
            // 遮罩层
            loading: true,
            // 选中数组
            ids: [],
            // 非单个禁用
            single: true,
            // 非多个禁用
            multiple: true,
            // 显示搜索条件
            showSearch: true,
            // 总条数
            total: 0,
            // 活动举办表格数据
            activityList: [],
            // 弹出层标题
            title: "",
            // 是否显示弹出层
            open: false,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                title: null,
                description: null,
                startTime: null,
                endTime: null,
                status: null,
                activityType: null,
                location: null,
                organizer: null,
                coOrganizer: null,
                contactPerson: null,
                contactPhone: null,
                qrCode: null,
                poster: null,
                moduleConfig: null,
                participantConfig: null,
            },
            // 表单参数
            form: {},
            // 表单校验
            rules: {
                title: [
                    {
                        required: true,
                        message: "活动名称不能为空",
                        trigger: "blur"
                    }
                ],
                startTime: [
                    {
                        required: true,
                        message: "活动开始时间不能为空",
                        trigger: "blur"
                    }
                ],
                endTime: [
                    {
                        required: true,
                        message: "活动结束时间不能为空",
                        trigger: "blur"
                    }
                ],
            },
            // 参与人配置弹窗
            participantConfigVisible: false,
            currentActivity: null,
            // 新增环节配置弹窗
            moduleConfigVisible: false,
            pickerOptions: {
                shortcuts: [{
                    text: '最近一周',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近一个月',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                        picker.$emit('pick', [start, end]);
                    }
                }, {
                    text: '最近三个月',
                    onClick(picker) {
                        const end = new Date();
                        const start = new Date();
                        start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                        picker.$emit('pick', [start, end]);
                    }
                }]
            },
            value2: '',
            // 关卡二维码弹窗
            moduleQRCodeDialog: {
                visible: false,
                title: '',
                qrCodeUrl: '',
                moduleInfo: '',
                activityId: null,
                moduleId: null
            },
            schoolList: [],
        }
    },
    created() {
        this.getList()
        this.getSchoolList()
    },
    methods: {
        /** 查询活动举办列表 */
        getList() {
            this.loading = true
            listActivity(this.queryParams).then(response => {
                this.activityList = response.rows
                this.total = response.total
                this.loading = false
            })
        },
        // 取消按钮
        cancel() {
            this.open = false
            this.reset()
        },
        // 表单重置
        reset() {
            this.form = {
                activityId: null,
                title: null,
                description: null,
                startTime: null,
                endTime: null,
                status: "0",
                activityType: null,
                location: null,
                organizer: null,
                coOrganizer: null,
                contactPerson: null,
                contactPhone: null,
                qrCode: null,
                poster: null,
                moduleConfig: null,
                participantConfig: null,
                createBy: null,
                createTime: null,
                updateBy: null,
                updateTime: null,
                remark: null
            }
            this.resetForm("form")
        },
        /** 搜索按钮操作 */
        handleQuery() {
            this.queryParams.pageNum = 1
            this.getList()
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.resetForm("queryForm")
            this.handleQuery()
        },
        // 多选框选中数据
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.activityId)
            this.single = selection.length !== 1
            this.multiple = !selection.length
        },
        /** 新增按钮操作 */
        handleAdd() {
            this.reset()
            this.open = true
            this.title = "添加活动举办"
        },
        /** 修改按钮操作 */
        handleUpdate(row) {
            this.reset()
            const activityId = row.activityId || this.ids
            getActivity(activityId).then(response => {
                this.form = response.data
                this.open = true
                this.title = "修改活动举办"
                console.log(this.form, '编辑')
            })
        },
        /** 提交按钮 */
        submitForm() {
            this.$refs["form"].validate(valid => {
                if (valid) {
                    if (this.form.activityId != null) {
                        console.log(this.form)
                        updateActivity(this.form).then(response => {
                            this.$modal.msgSuccess("修改成功")
                            this.open = false
                            this.getList()
                        })
                    } else {
                        addActivity(this.form).then(response => {
                            this.$modal.msgSuccess("新增成功")
                            this.open = false
                            this.getList()
                        })
                    }
                }
            })
        },
        /** 删除按钮操作 */
        handleDelete(row) {
            const activityIds = row.activityId || this.ids
            this.$modal.confirm('是否确认删除活动举办编号为"' + activityIds + '"的数据项？').then(function () {
                return delActivity(activityIds)
            }).then(() => {
                this.getList()
                this.$modal.msgSuccess("删除成功")
            }).catch(() => {
            })
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('activity/activity/export', {
                ...this.queryParams
            }, `activity_${new Date().getTime()}.xlsx`)
        },
        /** 配置环节 */
        handleConfigModules(row) {
            this.currentActivity = row;
            this.moduleConfigVisible = true;
        },
        /** 处理环节配置确认 */
        handleModuleConfigConfirm(configJson) {
            const updatedActivity = {
                ...this.currentActivity,
                moduleConfig: configJson
            };

            updateActivity(updatedActivity).then(response => {
                this.$modal.msgSuccess("环节配置更新成功");
                this.getList(); // 刷新列表
            }).catch(error => {
                this.$modal.msgError("环节配置更新失败");
                console.error('更新环节配置失败:', error);
            });
        },
        /** 配置参与人 */
        handleConfigParticipants(row) {
            this.currentActivity = row
            this.participantConfigVisible = true
        },
        /** 获取参与人配置摘要 */
        getParticipantSummary(participantConfig) {
            try {
                const config = JSON.parse(participantConfig)
                return `已选择 ${config.students ? config.students.length : 0} 名学生`
            } catch (e) {
                return '配置解析失败'
            }
        },
        /** 处理参与人配置确认 */
        handleParticipantConfigConfirm(config) {
            // 更新当前活动的参与人配置
            const updatedActivity = {...this.currentActivity}
            updatedActivity.participantConfig = JSON.stringify(config)

            // 调用更新API
            updateActivity(updatedActivity).then(response => {
                this.$modal.msgSuccess("参与人配置更新成功")
                this.getList() // 刷新列表
            }).catch(error => {
                this.$modal.msgError("参与人配置更新失败")
                console.error('更新参与人配置失败:', error)
            })
        },
        /** 预览二维码 */
        handlePreviewQRCode(row) {
            const activityId = row.activityId
            const baseApi = process.env.VUE_APP_BASE_API

            // 使用Element UI的对话框预览二维码
            this.$msgbox({
                title: '二维码预览',
                dangerouslyUseHTMLString: true,
                message: `
          <div style="text-align: center;">
            <img src="${baseApi}/activity/activity/qrcode/preview/${activityId}"
                 style="max-width: 300px; max-height: 300px; border: 1px solid #ddd; border-radius: 8px;"
                 alt="活动二维码"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                 onload="this.nextElementSibling.style.display='none';" />
            <div style="display: none; color: #f56c6c; font-size: 14px; margin-top: 20px;">
              <p>二维码加载失败</p>
              <p style="font-size: 12px; color: #999;">请检查网络连接或联系管理员</p>
            </div>
            <p style="margin-top: 10px; color: #666;display: none;">二维码信息：pages/activity/index?activityId=${activityId}</p>
            <p style="margin-top: 5px; color: #999; font-size: 12px;">扫描二维码可进入活动页面</p>
          </div>
        `,
                showCancelButton: true,
                confirmButtonText: '下载',
                cancelButtonText: '关闭',
                beforeClose: (action, instance, done) => {
                    if (action === 'confirm') {
                        // 点击下载按钮时触发下载
                        this.handleDownloadQRCode(row)
                    }
                    done()
                }
            }).catch(() => {
                // 用户取消
            })
        },
        /** 下载二维码 */
        handleDownloadQRCode(row) {
            const activityId = row.activityId
            const url = process.env.VUE_APP_BASE_API + `/activity/activity/qrcode/${activityId}`

            // 使用fetch下载文件
            fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + this.$store.getters.token
                }
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    // 创建下载链接
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `activity_qrcode_${activityId}.png`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);

                    this.$modal.msgSuccess("二维码下载成功");
                })
                .catch(error => {
                    console.error('下载失败:', error);
                    this.$modal.msgError("二维码下载失败，请重试");
                });
        },
        /** 复制按钮操作 */
        handleCopy(row) {
            const activityId = row.activityId;
            this.$modal.confirm('确认要复制活动"' + row.title + '"吗？').then(() => {
                return copyActivity(activityId)
            }).then(response => {
                this.$modal.msgSuccess("复制成功");
                this.getList();
            }).catch(() => {
                this.$modal.msgError("复制失败");
            });
        },
        getSchoolList() {
            listSchool().then(response => {
                this.schoolList = response.rows || response.data
            }).catch(error => {
                console.error("获取学校列表失败:", error)
                this.$modal.msgError("获取学校列表失败")
            })
        },
    }
}
</script>

<style scoped>
.participant-summary {
    margin-top: 8px;
    text-align: center;
}
</style>
