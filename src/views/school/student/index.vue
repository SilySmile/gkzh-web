<template>
    <div class="app-container">
        <el-form :model="queryParams" ref="queryForm" size="small"
                 :inline="true" v-show="showSearch" label-width="68px">
            <el-form-item label="学校" prop="schoolId">
                <el-select v-model="queryParams.schoolId"
                           placeholder="请选择学校" clearable
                           @change="handleQuerySchoolChange">
                    <el-option
                        v-for="school in schoolOptions"
                        :key="school.schoolId"
                        :label="school.title"
                        :value="school.schoolId"
                    ></el-option>
                </el-select>
            </el-form-item>

            <!-- 动态显示院系选择 -->
            <el-form-item v-if="queryShowCollegeSelect" label="院系"
                          prop="collegeId">
                <el-select v-model="queryParams.collegeId"
                           placeholder="请选择院系" clearable
                           @change="handleQueryCollegeChange">
                    <el-option
                        v-for="college in queryCollegeOptions"
                        :key="college.departmentId"
                        :label="college.title"
                        :value="college.departmentId"
                    ></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="专业" prop="departmentId">
                <el-select v-model="queryParams.departmentId"
                           placeholder="请选择专业" clearable>
                    <el-option
                        v-for="dept in queryDepartmentOptions"
                        :key="dept.departmentId"
                        :label="dept.title"
                        :value="dept.departmentId"
                    ></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="学号" prop="studentNo">
                <el-input
                    v-model="queryParams.studentNo"
                    placeholder="请输入学号"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="姓名" prop="studentName">
                <el-input
                    v-model="queryParams.studentName"
                    placeholder="请输入学生姓名"
                    clearable
                    @keyup.enter.native="handleQuery"
                />
            </el-form-item>
            <el-form-item label="注册状态" prop="registered">
                <el-select v-model="queryParams.registered" placeholder="请选择注册状态" clearable>
                    <el-option label="未注册" :value="0" />
                    <el-option label="已注册" :value="1" />
                </el-select>
            </el-form-item>
            <el-form-item label="性别" prop="gender">
                <el-select v-model="queryParams.gender" placeholder="请选择性别"
                           clearable>
                    <el-option label="男" value="0"></el-option>
                    <el-option label="女" value="1"></el-option>
                    <el-option label="未知" value="2"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="年级" prop="status">
                <el-select v-model="queryParams.grade" placeholder="请选择年级"
                           clearable>
                    <el-option
                        v-for="dict in dict.type.grade_type"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="录取方式" prop="lqfs">
                <el-select v-model="queryParams.lqfs" placeholder="请选择录取方式"
                           clearable>
                    <el-option
                        v-for="dict in dict.type.lqfs"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="生源地" prop="syd">
                <el-select v-model="queryParams.syd" placeholder="请选择生源地"
                           clearable>
                    <el-option
                        v-for="dict in dict.type.syd"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                    />
                </el-select>
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
                    type="primary"
                    plain
                    icon="el-icon-plus"
                    size="mini"
                    @click="handleAdd"
                    v-hasPermi="['school:student:add']"
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
                    v-hasPermi="['school:student:edit']"
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
                    v-hasPermi="['school:student:remove']"
                >删除
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="info" plain icon="el-icon-upload2" size="mini"
                           @click="handleImport"
                           v-hasPermi="['school:student:import']">导入
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    type="warning"
                    plain
                    icon="el-icon-download"
                    size="mini"
                    @click="handleExport"
                    v-hasPermi="['school:student:export']"
                >导出
                </el-button>
            </el-col>
            <right-toolbar :showSearch.sync="showSearch"
                           @queryTable="getList"></right-toolbar>
        </el-row>

        <el-table v-loading="loading" :data="studentList"
                  @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center"/>
            <el-table-column label="学生ID" align="center" prop="studentId"/>
            <el-table-column label="学校" align="center" prop="schoolName"/>
            <el-table-column label="院系" align="center" prop="collegeName"/>
            <el-table-column label="专业" align="center" prop="departmentName"/>
            <el-table-column label="学号" align="center" prop="studentNo"/>
            <el-table-column label="学生姓名" align="center"
                             prop="studentName"/>
            <el-table-column label="注册状态" align="center" prop="registered">
                <template slot-scope="scope"><el-tag :type="scope.row.registered === 1 ? 'success' : 'info'">{{ scope.row.registered === 1 ? '已注册' : '未注册' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="性别" align="center" prop="gender">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.sys_user_sex"
                              :value="scope.row.gender"/>
                </template>
            </el-table-column>
            <el-table-column label="年级" align="center" prop="grade">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.grade_type"
                              :value="scope.row.grade"/>
                </template>
            </el-table-column>
            <el-table-column label="录取方式" align="center" prop="lqfs">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.lqfs"
                              :value="scope.row.lqfs"/>
                </template>
            </el-table-column>
            <el-table-column label="生源地" align="center" prop="syd">
                <template slot-scope="scope">
                    <dict-tag :options="dict.type.syd"
                              :value="scope.row.syd"/>
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
                        icon="el-icon-edit"
                        @click="handleUpdate(scope.row)"
                        v-hasPermi="['school:student:edit']"
                    >修改
                    </el-button>
                    <el-button v-if="scope.row.registered === 1" size="mini" type="text" icon="el-icon-refresh" @click="handleResetPassword(scope.row)" v-hasPermi="['school:student:edit']">重置密码</el-button>
                    <el-button
                        size="mini"
                        type="text"
                        icon="el-icon-delete"
                        @click="handleDelete(scope.row)"
                        v-hasPermi="['school:student:remove']"
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

        <!-- 添加或修改学生对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="500px"
                   append-to-body>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="学校" prop="schoolId">
                    <el-select v-model="form.schoolId" placeholder="请选择学校"
                               @change="handleSchoolChange">
                        <el-option
                            v-for="school in schoolOptions"
                            :key="school.schoolId"
                            :label="school.title"
                            :value="school.schoolId"
                        ></el-option>
                    </el-select>
                </el-form-item>

                <!-- 动态显示院系选择 -->
                <el-form-item v-if="showCollegeSelect" label="院系"
                              prop="collegeId">
                    <el-select v-model="form.collegeId" placeholder="请选择院系"
                               @change="handleCollegeChange">
                        <el-option
                            v-for="college in collegeOptions"
                            :key="college.departmentId"
                            :label="college.title"
                            :value="college.departmentId"
                        ></el-option>
                    </el-select>
                </el-form-item>

                <!-- 动态显示专业选择 -->
                <el-form-item :label="showCollegeSelect ? '专业' : '专业'"
                              prop="departmentId">
                    <el-select v-model="form.departmentId"
                               placeholder="请选择专业">
                        <el-option
                            v-for="dept in departmentOptions"
                            :key="dept.departmentId"
                            :label="dept.title"
                            :value="dept.departmentId"
                        ></el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="学号" prop="studentNo">
                    <el-input v-model="form.studentNo"
                              placeholder="请输入学号"/>
                </el-form-item>
                <el-form-item label="学生姓名" prop="studentName">
                    <el-input v-model="form.studentName"
                              placeholder="请输入学生姓名"/>
                </el-form-item>
                <el-form-item label="性别" prop="gender">
                    <el-select v-model="form.gender" placeholder="请选择性别">
                        <el-option label="男" value="0"></el-option>
                        <el-option label="女" value="1"></el-option>
                        <el-option label="未知" value="2"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="手机号码" prop="phone">
                    <el-input v-model="form.phone"
                              placeholder="请输入手机号码"/>
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                    <el-input v-model="form.email" placeholder="请输入邮箱"/>
                </el-form-item>
                <el-form-item label="班级" prop="className">
                    <el-input v-model="form.className" placeholder="请输入班级"/>
                </el-form-item>
                <el-form-item label="入学年份" prop="enrollmentYear">
                    <el-input v-model="form.enrollmentYear" maxlength="4" placeholder="例如：2026"/>
                </el-form-item>
                <el-form-item label="年级" prop="grade">
                    <el-select v-model="form.grade" placeholder="请选择年级" clearable>
                        <el-option v-for="dict in dict.type.grade_type" :key="dict.value"
                                   :label="dict.label" :value="dict.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item label="录取方式" prop="lqfs">
                    <el-select v-model="form.lqfs" placeholder="请选择录取方式" clearable>
                        <el-option v-for="dict in dict.type.lqfs" :key="dict.value"
                                   :label="dict.label" :value="dict.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item label="生源地" prop="syd">
                    <el-select v-model="form.syd" placeholder="请选择生源地" clearable filterable>
                        <el-option v-for="dict in dict.type.syd" :key="dict.value"
                                   :label="dict.label" :value="dict.value"/>
                    </el-select>
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="form.status">
                        <el-radio
                            v-for="dict in dict.type.sys_normal_disable"
                            :key="dict.value"
                            :label="dict.value"
                        >{{ dict.label }}
                        </el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" type="textarea"
                              placeholder="请输入内容"/>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitForm">确 定</el-button>
                <el-button @click="cancel">取 消</el-button>
            </div>
        </el-dialog>

        <!-- 用户导入对话框 -->
        <el-dialog :title="upload.title" :visible.sync="upload.open"
                   width="400px" append-to-body>
            <el-upload ref="upload" :limit="1" accept=".xlsx, .xls"
                       :headers="upload.headers"
                       :action="upload.url + '?updateSupport=' + upload.updateSupport"
                       :disabled="upload.isUploading"
                       :on-progress="handleFileUploadProgress"
                       :on-success="handleFileSuccess" :auto-upload="false"
                       drag>
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em>
                </div>
                <div class="el-upload__tip text-center" slot="tip">
                    <div class="el-upload__tip" slot="tip">
                        <el-checkbox v-model="upload.updateSupport"/>
                        是否更新已经存在的用户数据
                    </div>
                    <span>仅允许导入xls、xlsx格式文件。</span>
                    <el-link type="primary" :underline="false"
                             style="font-size: 12px; vertical-align: baseline"
                             @click="importTemplate">下载模板
                    </el-link>
                </div>
            </el-upload>
            <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitFileForm">确 定
                </el-button>
                <el-button @click="upload.open = false">取 消</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import {
    listStudent,
    getStudent,
    delStudent,
    addStudent,
    updateStudent,
    resetStudentPassword
} from "@/api/school/student";
import {listSchool} from "@/api/school/school";
import {getToken} from "@/utils/auth"
import {listDepartment, getDepartmentTree} from "@/api/school/department";

export default {
    name: "Student",
    dicts: ['sys_user_sex', 'sys_normal_disable','grade_type','lqfs','syd'],
    data() {
        return {
            isUpdate: false,
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
            // 学生表格数据
            studentList: [],
            // 弹出层标题
            title: "",
            // 是否显示弹出层
            open: false,
            // 查询参数
            queryParams: {
                pageNum: 1,
                pageSize: 10,
                schoolId: null,
                departmentId: null,
                departmentIds: null,
                studentNo: null,
                studentName: null,
                registered: null,
                gender: null,
                status: null
            },
            // 表单参数
            form: {},
            // 表单校验
            rules: {
                schoolId: [
                    {required: true, message: "学校不能为空", trigger: "change"}
                ],
                collegeId: [
                    {required: true, message: "院系不能为空", trigger: "change"}
                ],
                departmentId: [
                    {required: true, message: "专业不能为空", trigger: "change"}
                ],
                studentNo: [
                    {required: true, message: "学号不能为空", trigger: "blur"}
                ],
                studentName: [
                    {
                        required: true,
                        message: "学生姓名不能为空",
                        trigger: "blur"
                    }
                ],
                gender: [
                    {required: true, message: "性别不能为空", trigger: "change"}
                ]
            },
            // 学校选项
            schoolOptions: [],
            // 专业选项
            departmentOptions: [],
            // 是否显示院系选择
            showCollegeSelect: false,
            // 院系选项
            collegeOptions: [],
            // 当前学校的部门层级结构
            departmentStructure: null,
            // 查询相关
            queryShowCollegeSelect: false,
            queryCollegeOptions: [],
            queryDepartmentOptions: [],
            // 用户导入参数
            upload: {
                // 是否显示弹出层（用户导入）
                open: false,
                // 弹出层标题（用户导入）
                title: "",
                // 是否禁用上传
                isUploading: false,
                // 是否更新已经存在的用户数据
                updateSupport: 0,
                // 设置上传的请求头部
                headers: {Authorization: "Bearer " + getToken()},
                // 上传的地址
                url: process.env.VUE_APP_BASE_API + "/school/student/importData"
            },
        };
    },
    created() {
        this.getList();
        this.getSchoolOptions();
    },
    methods: {
        /** 查询学生列表 */
        getList() {
            this.loading = true;
            listStudent(this.queryParams).then(response => {
                this.studentList = response.rows;
                this.total = response.total;
                this.loading = false;
            });
        },
        /** 获取学校选项 */
        getSchoolOptions() {
            listSchool().then(response => {
                this.schoolOptions = response.rows;
            });
        },
        /** 获取部门树结构 */
        getDepartmentStructure(schoolId) {
            if (schoolId) {
                getDepartmentTree(schoolId).then(response => {
                    this.departmentStructure = response.data;
                    this.analyzeDepartmentStructure();
                });
            } else {
                this.departmentStructure = null;
                this.showCollegeSelect = false;
                this.collegeOptions = [];
                this.departmentOptions = [];
            }
        },
        /** 分析部门层级结构 */
        analyzeDepartmentStructure() {
            console.log(this.departmentStructure)
            if (!this.departmentStructure || !Array.isArray(this.departmentStructure) || this.departmentStructure.length === 0) {
                this.showCollegeSelect = false;
                this.departmentOptions = [];
                this.queryShowCollegeSelect = false;
                this.queryCollegeOptions = [];
                this.queryDepartmentOptions = [];
                return;
            }
            const rootDepartments = this.departmentStructure;
            // 检查是否有二级结构（院系）
            const hasCollegeLevel = rootDepartments.some(dept =>
                dept.children && dept.children.length > 0
            );
            console.log(hasCollegeLevel)
            if (hasCollegeLevel) {
                // 学校-院系-专业 三级结构
                this.showCollegeSelect = true;
                this.collegeOptions = rootDepartments;
                this.departmentOptions = [];
                this.queryShowCollegeSelect = true;
                this.queryCollegeOptions = rootDepartments;
                this.queryDepartmentOptions = [];
            } else {
                // 学校-专业 二级结构
                this.showCollegeSelect = false;
                this.departmentOptions = rootDepartments;
                this.queryShowCollegeSelect = false;
                this.queryCollegeOptions = [];
                this.queryDepartmentOptions = rootDepartments;
            }
        },
        /** 获取专业选项 */
        getDepartmentOptions(parentId) {
            if (!parentId) {
                this.departmentOptions = [];
                this.queryDepartmentOptions = [];
                return;
            }

            if (this.showCollegeSelect) {
                // 从院系下获取专业
                const selectedCollege = this.collegeOptions.find(college => college.departmentId === parentId);
                if (selectedCollege && selectedCollege.children) {
                    this.departmentOptions = selectedCollege.children;
                } else {
                    this.departmentOptions = [];
                }
            } else {
                // 直接从学校下获取专业
                if (this.departmentStructure && Array.isArray(this.departmentStructure)) {
                    this.departmentOptions = this.departmentStructure;
                } else {
                    this.departmentOptions = [];
                }
            }

            // 同时更新查询的专业选项
            if (this.queryShowCollegeSelect) {
                // 从院系下获取专业
                const selectedCollege = this.queryCollegeOptions.find(college => college.departmentId === parentId);
                if (selectedCollege && selectedCollege.children) {
                    this.queryDepartmentOptions = selectedCollege.children;
                } else {
                    this.queryDepartmentOptions = [];
                }
            } else {
                // 直接从学校下获取专业
                if (this.departmentStructure && Array.isArray(this.departmentStructure)) {
                    this.queryDepartmentOptions = this.departmentStructure;
                } else {
                    this.queryDepartmentOptions = [];
                }
            }
        },
        /** 学校选择变化 */
        handleSchoolChange(schoolId) {
            this.form.collegeId = null;
            this.form.departmentId = null;
            console.log(schoolId);
            this.getDepartmentStructure(schoolId);
        },
        /** 院系选择变化 */
        handleCollegeChange(collegeId) {
            this.form.departmentId = null;
            this.getDepartmentOptions(collegeId);
        },
        // 取消按钮
        cancel() {
            this.open = false;
            this.reset();
        },
        // 表单重置
        reset() {
            this.form = {
                studentId: null,
                schoolId: null,
                collegeId: null,
                departmentId: null,
                studentNo: null,
                studentName: null,
                gender: "0",
                phone: null,
                email: null,
                className: null,
                enrollmentYear: null,
                grade: null,
                lqfs: null,
                syd: null,
                status: "0",
                remark: null,
            };
            this.resetForm("form");
            this.showCollegeSelect = false;
            this.collegeOptions = [];
            this.departmentOptions = [];
        },
        /** 搜索按钮操作 */
        handleQuery() {
            console.log('搜索前参数:', this.queryParams);

            // 如果选择了院系但没有选择专业，需要获取该院系下的所有专业ID
            if (this.queryParams.collegeId && !this.queryParams.departmentId) {
                const selectedCollege = this.queryCollegeOptions.find(college => college.departmentId === this.queryParams.collegeId);
                if (selectedCollege && selectedCollege.children && selectedCollege.children.length > 0) {
                    // 获取该院系下所有专业的ID
                    const departmentIds = selectedCollege.children.map(dept => dept.departmentId);
                    // 创建多个查询条件，每个专业ID一个查询
                    this.queryParams.departmentIds = departmentIds;
                    // 清除单个专业ID，避免冲突
                    this.queryParams.departmentId = null;
                    console.log('按院系搜索，专业ID列表:', departmentIds);
                }
            } else {
                // 如果选择了具体专业，清除专业ID列表
                this.queryParams.departmentIds = null;
                console.log('按具体专业搜索，专业ID:', this.queryParams.departmentId);
            }

            // 保存collegeId用于显示，但不在查询参数中传递
            const collegeIdForDisplay = this.queryParams.collegeId;

            // 创建查询参数副本，移除collegeId字段
            const searchParams = {...this.queryParams};
            delete searchParams.collegeId;

            console.log('发送到后端的查询参数:', searchParams);
            console.log('保留用于显示的collegeId:', collegeIdForDisplay);

            this.queryParams.pageNum = 1;

            // 使用修改后的参数进行查询
            this.loading = true;
            listStudent(searchParams).then(response => {
                this.studentList = response.rows;
                this.total = response.total;
                this.loading = false;
                console.log('搜索完成，恢复collegeId显示');
            });

            // 恢复collegeId用于显示
            this.queryParams.collegeId = collegeIdForDisplay;
        },
        /** 重置按钮操作 */
        resetQuery() {
            this.resetForm("queryForm");
            this.queryShowCollegeSelect = false;
            this.queryCollegeOptions = [];
            this.queryDepartmentOptions = [];
            this.queryParams.departmentIds = null;
            this.queryParams.collegeId = null;
            this.handleQuery();
        },
        // 多选框选中数据
        handleSelectionChange(selection) {
            this.ids = selection.map(item => item.studentId)
            this.single = selection.length !== 1
            this.multiple = !selection.length
        },
        /** 新增按钮操作 */
        handleAdd() {
            this.isUpdate = false;
            this.reset();
            this.open = true;
            this.title = "添加学生";
        },
        /** 修改按钮操作 */
        handleUpdate(row) {
            this.isUpdate = true;
            this.reset();
            const studentId = row.studentId || this.ids;
            getStudent(studentId).then(response => {
                this.form = response.data;
                // 根据学生信息加载部门结构
                if (this.form.schoolId) {
                    // 使用 Promise 确保异步操作完成
                    this.loadDepartmentStructure(this.form.schoolId, this.form.collegeId, this.form.departmentId).then(() => {
                        this.open = true;
                        this.title = "修改学生";
                    });
                } else {
                    this.open = true;
                    this.title = "修改学生";
                }
            });
        },

        // 专门用于加载部门结构并返回 Promise 的方法，增加对院系和专业的处理
        loadDepartmentStructure(schoolId, collegeId, departmentId) {
            return new Promise((resolve) => {
                if (schoolId) {
                    getDepartmentTree(schoolId).then(response => {
                        this.departmentStructure = response.data;
                        this.analyzeDepartmentStructure();

                        // 如果是三级结构且有院系ID
                        if (this.showCollegeSelect && collegeId) {
                            this.form.collegeId = collegeId;
                            // 加载对应院系的专业选项
                            this.$nextTick(() => {
                                this.handleCollegeChange(collegeId);
                                // 设置专业ID
                                this.$nextTick(() => {
                                    this.form.departmentId = departmentId;
                                    resolve();
                                });
                            });
                        } else if (!this.showCollegeSelect && departmentId) {
                            // 二级结构直接设置专业选项
                            this.departmentOptions = this.departmentStructure;
                            this.form.departmentId = departmentId;
                            resolve();
                        } else {
                            resolve();
                        }
                    });
                } else {
                    this.departmentStructure = null;
                    this.showCollegeSelect = false;
                    this.collegeOptions = [];
                    this.departmentOptions = [];
                    resolve();
                }
            });
        },
        /** 提交按钮 */
        submitForm() {
            // 动态设置验证规则
            const rules = {...this.rules};

            // 如果不显示院系选择，移除院系验证
            if (!this.showCollegeSelect) {
                delete rules.collegeId;
            }

            this.$refs["form"].validate(valid => {
                if (valid) {
                    if (this.form.studentId != null) {
                        updateStudent(this.form).then(response => {
                            this.$modal.msgSuccess("修改成功");
                            this.open = false;
                            this.getList();
                        });
                    } else {
                        addStudent(this.form).then(response => {
                            this.$modal.msgSuccess("新增成功");
                            this.open = false;
                            this.getList();
                        });
                    }
                }
            });
        },
        /** 删除按钮操作 */
        handleDelete(row) {
            const studentIds = row.studentId || this.ids;
            this.$modal.confirm('是否确认删除学生编号为"' + studentIds + '"的数据项？').then(function () {
                return delStudent(studentIds);
            }).then(() => {
                this.getList();
                this.$modal.msgSuccess("删除成功");
            }).catch(() => {
            });
        },
        /** 将已注册学生的小程序密码重置为 123456 */
        handleResetPassword(row) {
            this.$modal.confirm('确认将“' + row.studentName + '”的小程序登录密码重置为 123456 吗？').then(() => {
                return resetStudentPassword(row.studentId);
            }).then(() => {
                this.$modal.msgSuccess("密码已重置为 123456");
                this.getList();
            }).catch(() => {});
        },
        /** 导出按钮操作 */
        handleExport() {
            this.download('school/student/export', {
                ...this.queryParams
            }, `学生信息_${new Date().getTime()}.xlsx`)
        },
        // 查询相关
        handleQuerySchoolChange(schoolId) {
            this.queryParams.collegeId = null;
            this.queryParams.departmentId = null;
            this.queryParams.departmentIds = null;
            this.queryShowCollegeSelect = false;
            this.queryCollegeOptions = [];
            this.queryDepartmentOptions = [];
            if (schoolId) {
                this.getDepartmentStructure(schoolId);
            }
        },
        handleQueryCollegeChange(collegeId) {
            this.queryParams.departmentId = null;
            this.queryParams.departmentIds = null;
            this.getDepartmentOptions(collegeId);
        },
        /** 导入按钮操作 */
        handleImport() {
            this.upload.title = "导入学生信息"
            this.upload.open = true
        },
        /** 下载模板操作 */
        importTemplate() {
            this.download('school/student/importTemplate', {}, `学生信息模板.xlsx`)
        },
        // 文件上传中处理
        handleFileUploadProgress(event, file, fileList) {
            this.upload.isUploading = true
        },
        // 文件上传成功处理
        handleFileSuccess(response, file, fileList) {
            this.upload.open = false
            this.upload.isUploading = false
            this.$refs.upload.clearFiles()
            this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", {dangerouslyUseHTMLString: true})
            this.getList()
        },
        // 提交上传文件
        submitFileForm() {
            this.$refs.upload.submit()
        }
    }
};
</script>
