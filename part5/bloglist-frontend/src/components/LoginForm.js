import PropTypes from 'prop-types'

import blogService from '../services/blogs'
import loginService from '../services/login'

const LoginForm = props => {
  const { notifyWith, user, setUser, username, setUsername, password, setPassword } = props

  const handleLogin = async (event) => {
    event.preventDefault()

    try {
      const user = await loginService.login({
        username, password,
      })

      window.localStorage.setItem(
        'loggedBlogappUser', JSON.stringify(user)
      )

      blogService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      console.log(exception)
      notifyWith('wrong credentials', 'error')
      setTimeout(() => { }, 3000)
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem('loggedBlogappUser')
    setUser(null)
    notifyWith('Log out')
    setTimeout(() => { }, 3000)
  }

  if (user) {
    return (
      <div>
        <p>
          {user.name} logged in
          <button onClick={handleLogout}>logout</button>
        </p>
      </div>
    )
  } else {
    return (
      <div>
        <h2>log in to application</h2>
        <div>
          <form onSubmit={handleLogin}>
            <div>
							username
              <input
                type="text"
                value={username}
                name="Username"
                onChange={({ target }) => setUsername(target.value)}
              />
            </div>
            <div>
							password
              <input
                type="password"
                value={password}
                name="Password"
                onChange={({ target }) => setPassword(target.value)}
              />
            </div>
            <button type="submit">login</button>
          </form>
        </div>
      </div>
    )
  }
}

LoginForm.propTypes = {
  setUser: PropTypes.func.isRequired,
  setUsername: PropTypes.func.isRequired,
  setPassword: PropTypes.func.isRequired,
  username: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired
}

export default LoginForm