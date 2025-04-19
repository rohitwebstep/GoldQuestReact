import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { useApiCall } from '../ApiCallContext';
const UpdatePasswordForm = () => {
        const { isApiLoading ,checkAuthentication} = useApiCall();
    
    const [newPass, setNewPass] = useState({
        newpass: '',
        c_newpass: '',
    });
    const [passError, setPassError] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;
        setNewPass((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (passError[name]) {
            setPassError((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const NewErr = {};
    
        // Check if the new password is provided and its length is between 8 and 10 characters
        if (!newPass.newpass) NewErr.newpass = 'This is required';
        else if (newPass.newpass.length < 8 || newPass.newpass.length > 10) 
            NewErr.newpass = 'Password must be between 8 and 10 characters long';
    
        // Check if the confirmation password is provided
        if (!newPass.c_newpass) NewErr.c_newpass = 'This is required';
        else if (newPass.c_newpass !== newPass.newpass) 
            NewErr.c_newpass = 'Passwords do not match';
    
        return NewErr;
    };

       useEffect(() => {
            const fetchData = async () => {
                if (!isApiLoading) {
                    await checkAuthentication();
                }
            };
        
            fetchData();
        }, []);
    

    const handleSubmit = (e) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length === 0) {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                new_password: newPass.newpass, // Use the new password from the state
                admin_id: admin_id, // Replace with the actual admin ID as needed
                _token: storedToken // Use the actual token as needed
            });

            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            };

            fetch("https://api.goldquestglobal.in/admin/update-password", requestOptions)
            .then(response => {
                const result = response.json();
                const newToken = result._token || result.token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                  if (!response.ok) {
                      return response.text().then(text => {
                          const errorData = JSON.parse(text);
                          Swal.fire(
                              'Error!',
                              `An error occurred: ${errorData.message}`,
                              'error'
                          );
                          throw new Error(text);
                      });
                  }
                  return result;
              })
                .then((result) => {
                    // Clear form and errors on successful update
                    setNewPass({ newpass: '', c_newpass: '' });
                    setPassError({});
                })
                .catch((error) => {
                    console.error('Error:', error);
                    // Handle error accordingly, maybe set an error message in state
                });
        } else {
            setPassError(errors);
        }
    };

    return (
        <form className='mt-4' onSubmit={handleSubmit}>
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newpass">New Password</label>
                <input
                    type="password"
                    name="newpass"
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="newpassword"
                    placeholder='********'
                    onChange={handleChange}
                    value={newPass.newpass}
                />
                {passError.newpass && <p className='text-red-500'>{passError.newpass}</p>}
            </div>
            <div className="mb-6 text-left">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="c_newpass">Confirm New Password</label>
                <input
                    type="password"
                    name="c_newpass"
                    className="appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="confirmnewpassword"
                    placeholder='********'
                    onChange={handleChange}
                    value={newPass.c_newpass}
                />
                {passError.c_newpass && <p className='text-red-500'>{passError.c_newpass}</p>}
            </div>
            <button type="submit" className='bg-[#3e76a5] text-white p-3 rounded-md w-full mb-4 hover:bg-[#3e76a5]'>Update Password</button>
        </form>
    );
};

export default UpdatePasswordForm;
