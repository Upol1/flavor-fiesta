import axios from "axios";
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../helpers/const";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (formData) => {
    try {
      await axios.post(`${API}/user/register/`, formData);
      navigate("/login");
    } catch (error) {
      console.error("Ошибка регистрации:", error);
    }
  };

  const handleLogin = async (formData, email) => {
    try {
      const { data } = await axios.post(`${API}/user/login/`, formData);
      console.log("Токены после логина:", data);

      if (data && data.access && data.refresh) {
        localStorage.setItem("tokens", JSON.stringify(data));
        localStorage.setItem("email", JSON.stringify(email));
        setCurrentUser(email);
        navigate("/");
      } else {
        throw new Error("Ошибка получения токенов");
      }
    } catch (error) {
      console.error("Ошибка входа:", error);
    }
  };

  const checkAuth = async () => {
    try {
      const tokensString = localStorage.getItem("tokens");
      console.log("Токены из localStorage (строка):", tokensString);

      if (!tokensString) {
        throw new Error("Токены отсутствуют в localStorage");
      }

      const tokens = JSON.parse(tokensString);
      console.log("Токены после парсинга:", tokens);

      if (!tokens || !tokens.refresh) {
        throw new Error("Токены отсутствуют или недействительны");
      }

      console.log("Отправка запроса на обновление токена...");
      const { data } = await axios.post(`${API}/user/refresh/`, {
        refresh: tokens.refresh,
      });

      console.log("Новые токены:", data);
      localStorage.setItem(
        "tokens",
        JSON.stringify({ access: data.access, refresh: tokens.refresh })
      );

      const emailString = localStorage.getItem("email");
      if (!emailString) {
        throw new Error("Email отсутствует в localStorage");
      }

      const email = JSON.parse(emailString);
      console.log("Текущий пользователь:", email);
      setCurrentUser(email);
    } catch (error) {
      console.error("Ошибка проверки аутентификации:", error);
      handleLogOut(); // Очищаем данные при ошибке
    }
  };

  useEffect(() => {
    console.log("Проверка аутентификации при загрузке");
    checkAuth();
  }, []);

  const handleLogOut = () => {
    localStorage.removeItem("tokens");
    localStorage.removeItem("email");
    setCurrentUser(null);
    navigate("/login");
  };

  const handlePasswordReset = async (emailOrLogin) => {
    try {
      await axios.post(`${API}/user/forgot_password/`, { email: emailOrLogin });
      console.log(`Запрос на сброс пароля для: ${emailOrLogin}`);
    } catch (error) {
      console.error("Ошибка восстановления пароля:", error);
      throw new Error(
        "Ошибка восстановления пароля. Пожалуйста, попробуйте снова."
      );
    }
  };

  const values = {
    handleRegister,
    handleLogin,
    currentUser,
    checkAuth,
    handleLogOut,
    handlePasswordReset,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
