import { useState, useEffect } from "react";
import api from "@/utils/api"; 
import {useUser} from "@/context/UserContext"
import { useTheme } from "@/context/ThemeContext";
export default function SettingsPage() {

  const [ModifyPasswordExtended, setModifyPasswordExtened] = useState(false);
  const [FeedbackExtended, setFeedbackExtended] = useState(false);
  const { theme, toggleTheme } = useTheme(); 

  const [passwordForm, setPasswordForm] = useState({
    originalPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [feedbackForm, setFeedbackForm] = useState({
    title: "",
    content: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  useEffect(() => {
  if (message) {
    const timer = setTimeout(() => {
      setMessage(null);
    }, 3000);
    // 清理函数：如果组件卸载或 message 变化，清除上一个定时器
    return () => clearTimeout(timer);
  }
}, [message]);
  

  const handleFeedbackToggle = () => {
    setFeedbackExtended((prev) => !prev);
    setMessage(null);
  }

  const handleModifyPasswordToggle = () => {
    setModifyPasswordExtened((prev) => !prev);
    setMessage(null);
  }

  const handleFeedBackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  }

  // 处理输入框变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    // 清除错误提示
    if (message) setMessage(null);
  };
   const {user, logout} = useUser();
  // 提交修改密码
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { originalPassword, newPassword, confirmPassword } = passwordForm;

    // 前端基础验证
    if (!originalPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "所有字段都不能为空" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "新密码长度至少需要6位" });
      return;
    }

    setLoading(true);
    try {
      // 调用后端 API
      await api.post("/users/password", {
        originalPassword,
        newPassword,
      });

      setMessage({ type: "success", text: "密码修改成功！请重新登录。" });
      
      // 清空表单
      setPasswordForm({ originalPassword: "", newPassword: "", confirmPassword: "" });

      setTimeout(() => {
        logout();
      }, 2000);

    } catch (err: any) {
       let errorText = "修改失败，请检查原密码是否正确";

      if (err.response?.data) {
          const data = err.response.data;

          if (data.message) {
              errorText = data.message;
          } 
          else if (typeof data === "string") {
              errorText = data;
          }
          else if (typeof data === "object") {
              errorText = JSON.stringify(data); 
          }
      }
      
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };


  //提交反馈
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, content } = feedbackForm;
    if (!title ){
      setMessage({ type: "error", text: "标题不能为空" });
      return;
    }
    if (!content ){
      setMessage({ type: "error", text: "内容不能为空" });
      return;
    }
    setLoading(true);
    try {
      await api.post("users/feedback",{
        title,
        content,
      });
      setMessage({ type: "success", text: "反馈提交成功！感谢您的宝贵意见。" });
      setFeedbackForm({ title: "", content: "" });
    } catch (err: any) {
        let errorText = "反馈提交失败，请稍后重试";
        if (err.response?.data) {
            const data = err.response.data;
            if (data.message) {
                errorText = data.message;
            }
            else if (typeof data === "string") {
                errorText = data;
            }
            else if (typeof data === "object") {
                errorText = JSON.stringify(data);
            }
        }
        setMessage({ type: "error", text: errorText });
    } finally {
        setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-4 sm:p-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">设置</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">管理您的账户偏好和安全设置</p>
        </div>

        {/* 1. 外观设置卡片 */}
        <section className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700">
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">深色模式</p>
            </div>
            
            {/* 切换开关 */}
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none dark:focus:ring-offset-neutral-800 ${
                theme === "dark" ? "bg-gray-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`${
                  theme === "dark" ? "translate-x-6" : "translate-x-0"
                } inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-sm flex items-center justify-center`}
              >
              </span>
            </button>
          </div>
        </section>

        {user && (
              <section className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700 transition-colors duration-300">
                {/* 1. 头部区域：点击整个头部也可以触发切换，体验更好 */}
                <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={handleModifyPasswordToggle}
                >
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">修改密码</p>
                        </div>
                    </div>
                    
                    {/* 按钮部分 */}
                    <button>
                        {ModifyPasswordExtended ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </button>
                </div>


                <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                        ModifyPasswordExtended 
                            ? "grid-rows-[1fr] opacity-100" 
                            : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                    {/* 内层容器：必须有 min-h-0 或 overflow-hidden */}
                    <div className="overflow-hidden">
                        <div className="pt-6 border-t border-gray-100 dark:border-neutral-700 mt-4">
                            
                            {/* --- 这里放入你的表单 --- */}
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">旧密码</label>
                                    <input
                                        type="password"
                                        name="originalPassword"
                                        value={passwordForm.originalPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="旧密码"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="设置新密码"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">确认密码</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="确认密码"
                                    />
                                </div>
                                {message && (
                                    <div className={`text-sm p-3 rounded-md ${
                                        message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                                    >
                                        {loading ? "提交中..." : "确认修改"}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
            </section>
        )

        }

        
        
        <section className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-neutral-700 transition-colors duration-300">
           <div 
                    className="flex items-center justify-between cursor-pointer" 
                    onClick={handleFeedbackToggle}
                >
                    <div className="flex items-center gap-2">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">提交反馈</p>
                        </div>
                    </div>
                    
                    {/* 按钮部分 */}
                    <button>
                        {FeedbackExtended ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600 dark:text-gray-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        )}
                    </button>
                </div>


                <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                        FeedbackExtended 
                            ? "grid-rows-[1fr] opacity-100" 
                            : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                    {/* 内层容器：必须有 min-h-0 或 overflow-hidden */}
                    <div className="overflow-hidden">
                        <div className="pt-6 border-t border-gray-100 dark:border-neutral-700 mt-4">
                            
                            {/* --- 这里放入你的表单 --- */}
                            <form onSubmit={handleSubmitFeedback} className="space-y-4 max-w-md mx-auto">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={feedbackForm.title}
                                        onChange={handleFeedBackChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        placeholder="输入标题"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">内容</label>
                                    <textarea
                                        name="content"
                                        value={feedbackForm.content}
                                        rows={4}
                                        onChange={handleFeedBackChange}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors resize-none"
                                        placeholder="反馈内容"
                                    />
                                </div>
                                {message && (
                                    <div className={`text-sm p-3 rounded-md ${
                                        message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                                    >
                                        {loading ? "提交中..." : "提交反馈"}
                                    </button>
                                </div>
                            </form>

                        </div>
                    </div>
                </div>
        </section>
        
        
      </div>
    </div>
  );
}