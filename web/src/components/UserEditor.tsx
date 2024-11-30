import { useCallback, useEffect, useState } from "react";
import User from "../types/user";
import { baseApi } from "../api/baseApi";
import { Button, Card, Form, Table } from "react-bootstrap";
import { toast } from "react-toastify";

const UserEditor = () => {
  const [user, setUser] = useState<User | null>(null);
  const [, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const reloader = useCallback(() => setReload(e => e + 1), [])
  useEffect(() => {

    async function fetchData() {
      const data = await baseApi.get('/users/me')
      if (data.status === 200) {
        setUser(data.data)
        setLoading(false)
      } 
    }
    fetchData();

  }, [])
  
  return (<Card className="mt-4 ">
    <Card.Header>User management</Card.Header>
    <Card.Body>
      {user?.superAdmin ? "You are an admin. You can view other users." : "You are not an admin. You can only edit yourself"}
      {user && <InfoEditor userId={user.id} current={user}  reloader={reloader}/>}
      {user &&  Boolean(user.superAdmin) === true && <UserManagementModule refcnt={reload}/>}
      {user && Boolean(user.superAdmin) === true && <SimpleUserCreationModule reloader={reloader}/>}
    </Card.Body>
    <br/><br/>
  </Card>)
}


interface InfoEditorProps {
  userId: number;
  current: User;
  reloader: () => void;
}

const InfoEditor: React.FC<InfoEditorProps> = ({ current, reloader }) => {
  const [userEditorState, setUserEditorState] = useState<User>(() => ({ ...current, password: "" }));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null)
  const [retry, setRetry] = useState('')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUserEditorState({ ...userEditorState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setMessage(null)

      try {
        if (userEditorState.password !== retry) {
          toast.error("Passwords do not match.")
          return
        }
          const userData = {
              ...userEditorState,
              password: userEditorState.password === "" ? null : userEditorState.password,
          };

          // Replace with your actual API call
          await baseApi.put(`/users/modify`, userData)

          toast.success("Successfully updated user.")
     
          reloader()



           
      } catch (error) {
          setMessage("An error occurred.")
          toast.error('Error updating user.')
          console.error('Error updating user:', error);
      } finally {
          setLoading(false);
      }
  };

  return (
      <div className="mt-4">
          <h4>Your Profile</h4>
          <hr />
          {message && <div>{message}</div>}
          <form onSubmit={handleSubmit}>
              <div>
                  <Form.Label htmlFor="name">Name:</Form.Label><br/>
                  <Form.Control
                      type="text"
                      id="name"
                      name="name"
                      value={userEditorState.name}
                      onChange={handleChange}
                      required
                  />
              </div>
              <div>
                  <Form.Label htmlFor="password">Password:</Form.Label><br/>
                  <Form.Control
                      type="password"
                      id="password"
                      name="password"
                      value={userEditorState.password || ''}
                      onChange={handleChange}
                  />
              </div>
              <div>
                <Form.Label htmlFor="retryPass">Retype Password:</Form.Label>
                <Form.Control
                  type="password"
                  id="retryPass"
                  name="retryPass"
                  value={retry}
                  onChange={(e) => setRetry(e.target.value)}
                />
                </div>
              <div className="p-1">
                Super Admin: {userEditorState.superAdmin ? "Yes" : "No"}
              </div>
              <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
              </Button>
          </form>
      </div>
  );
};


const UserManagementModule = ({refcnt = 0}) => {
  const [users, setUsers] = useState<User[]>([])
 

  useEffect(() => {
    async function fetchData() {
      const data = await baseApi.get('/users/list')
      if (data.status === 200) {
        setUsers(data.data)
 
      } else {
        toast.warn("Error getting user list")
      }

    }
    fetchData();
  }, [refcnt])

  const deleteApi = useCallback(async (num: number) => {
    await baseApi.delete(
      `/users/delete/${num}`
    )
    toast.success("User deleted successfully")
    setUsers(u => [
      ...u.filter(u => u.id !== num)
    ])

  }, [])
  return (<div className="mt-4">
    <h4>User Management</h4>
    <hr/>
    User List<br/>
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Super Admin</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.id}</td>
            <td>{user.name}</td>
            <td>{user.superAdmin ? 'Yes' : 'No'}</td>
            <td>
              {Boolean(user.superAdmin) ? null : 
              <Button className="btn-danger btn-sm" onClick={() => deleteApi(user.id)}>Delete</Button>}
            </td>
          </tr>
        ))}
      </tbody>

    </Table>
  </div>)

}


 
const SimpleUserCreationModule = ({ reloader}: {reloader: () => void}) => {
  const [newUser, setNewUser] = useState<User>({name: "", password: "", superAdmin: false, id: -1, username: ""})
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // min length 5 username/name/password
      if ((newUser.username||"").length < 5 || newUser.name.length < 5 || (newUser.password||"").length < 5) {
        toast.error("Username/Name/Password must be at least 5 characters long")
        return;
      }
      await baseApi.post("/users/create", newUser)
      toast.success("User created successfully")
      reloader()
    } catch (e: any) {
      toast.error("Error creating user! " + (typeof e?.response?.data === "string" ? e.response.data : "Unknown Error"))
    } finally {
      setLoading(false)
      setNewUser({...newUser, password: ""})
      reloader()
 
    }
  }
  return (
    <div className="mt-4">
      <h4>User Creation</h4>
      <hr/>
      <Form onSubmit={handleSubmit}>
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Form.Control type="text" value={newUser.username ?? ""} onChange={e => setNewUser({...newUser, username: e.target.value})}/>
        </Form.Group>
        <Form.Group>
          <Form.Label>Name</Form.Label>
          <Form.Control type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}/>
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control type="password" value={newUser.password ?? ""} onChange={e => setNewUser({...newUser, password: e.target.value})}/>
        </Form.Group>
        
        <Button type="submit" className="mt-2" disabled={loading}>Create</Button>
      </Form>
    </div>
  )

  
}

export default UserEditor;