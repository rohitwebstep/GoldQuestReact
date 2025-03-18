import React, { useState } from "react";
import { useEditClient } from './ClientEditContext';
import ServicesEditForm from './ServicesEditForm';
import { State } from 'country-state-city';
import PulseLoader from 'react-spinners/PulseLoader'; // Import the PulseLoader


export const ClientEditForm = () => {
    const states = State.getStatesOfCountry('IN');
    const options = states.map(state => ({ value: state.isoCode, label: state.name }));
    const { refs, clientData, handleClientChange, handleClientSubmit, setFiles, errors, loading, setClientData, setErrors, admins } = useEditClient();
    let emails = clientData.emails;
    if (typeof emails === 'string') {
        try {
            emails = JSON.parse(emails);
        } catch (error) {
            emails = [];
        }
    }
    const newEmails = Array.isArray(emails) ? emails : [];
    const handleEmailChange = (index, value) => {
        const updatedEmails = [...newEmails];
        updatedEmails[index] = value;
        handleClientChange({ target: { name: 'emails', value: updatedEmails } });
    };
    const deleteEmails = (index) => {
        const updatedEmails = newEmails.filter((_, i) => i !== index);
        handleClientChange({ target: { name: 'emails', value: updatedEmails } });
    };

    const addNewEmailField = () => {
        const updatedEmails = [...newEmails, ""];
        handleClientChange({ target: { name: 'emails', value: updatedEmails } });
    };


    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

        const maxSize = 2 * 1024 * 1024; // 2MB size limit
        const allowedTypes = [
            'image/jpeg', 'image/png', 'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]; // Allowed file types

        let errors = [];

        selectedFiles.forEach((file) => {
            if (file.size > maxSize) {
                errors.push(`${file.name}: File size must be less than 2MB.`);
            }

            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type. Only JPG, PNG, PDF, DOCX, and XLSX are allowed.`);
            }
        });

        if (errors.length > 0) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [fileName]: errors,
            }));
            return;
        }

        setFiles((prevFiles) => ({
            ...prevFiles,
            [fileName]: selectedFiles,
        }));

        setErrors((prevErrors) => {
            const { [fileName]: removedError, ...restErrors } = prevErrors; // Remove the error for this field if valid
            return restErrors;
        });
    };


    return (
        <>
            <div className="py-4 md:py-16 m-4">
                <h2 className="md:text-4xl text-2xl md:mb-8 font-bold pb-8 md:pb-4 text-center">
                    Client Edit
                </h2>
                <div className="md:w-9/12 m-auto bg-white shadow-md border rounded-md p-3 md:p-10">
                    {loading ? (
                        <div className='flex justify-center items-center py-6 h-full'>
                            <PulseLoader color="#36D7B7" loading={loading} size={15} aria-label="Loading Spinner" />

                        </div>
                    ) :
                        (<form onSubmit={handleClientSubmit} >
                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="name">Company Name: <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.name}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["name"] = el)}

                                    />
                                    {errors.name && <p className="text-red-500">{errors.name}</p>}
                                </div>

                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="client_unique_id">Client Code: <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="client_unique_id"
                                        id="client_unique_id"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.client_unique_id}
                                        disabled
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["client_unique_id"] = el)}

                                    />
                                    {errors.client_unique_id && <p className="text-red-500">{errors.client_unique_id}</p>}
                                </div>
                            </div>
                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="address">address: <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="address"
                                        id="address"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.address}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["address"] = el)}

                                    />
                                    {errors.address && <p className="text-red-500">{errors.address}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="mobile">Mobile: <span className="text-red-600">*</span></label>
                                    <input
                                        type="number"
                                        name="mobile"
                                        id="mobile"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.mobile}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["mobile"] = el)}

                                    />
                                    {errors.mobile && <p className="text-red-500">{errors.mobile}</p>}
                                </div>

                            </div>

                            <div className="md:flex gap-5">

                                <div className="mb-4 md:w-6/12">
                                    <label htmlFor="contact_person_name">Contact Person: <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="contact_person_name"
                                        id="contact_person_name"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.contact_person_name}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["contact_person_name"] = el)}

                                    />
                                    {errors.contact_person_name && <p className="text-red-500">{errors.contact_person_name}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="state">State: <span className="text-red-600">*</span></label>
                                    <select name="state" id="state" className="w-full border p-2 rounded-md mt-2" ref={(el) => (refs.current["state"] = el)}
                                        value={clientData.state} onChange={handleClientChange}>
                                        {options.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.state && <p className="text-red-500">{errors.state}</p>}
                                </div>
                            </div>

                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="state_code">State Code: <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="state_code"
                                        id="state_code"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.state_code}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["state_code"] = el)}

                                    />
                                    {errors.state_code && <p className="text-red-500">{errors.state_code}</p>}
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="escalation_admin_id">Name of the Escalation Point of Contact:<span className="text-red-600">*</span></label>

                                    <select
                                        name="escalation_admin_id"
                                        ref={(el) => (refs.current["escalation_admin_id"] = el)} // Attach ref here
                                        id="escalation_admin_id"
                                        value={clientData.escalation_admin_id}
                                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                                        onChange={handleClientChange}
                                    >
                                        <option value="">Select Option</option>
                                        {admins.map((item, index) => {
                                            return (
                                                <>
                                                    <option value={item.id}>{item.name}({item.emp_id})</option>

                                                </>
                                            )
                                        })}
                                    </select>
                                    {errors.escalation_admin_id && <p className="text-red-500">{errors.escalation_admin_id}</p>}
                                </div>

                                <div className="mb-4">
                                    <label className="text-gray-500" htmlFor="director_email">Director email
                                    </label>
                                    <input
                                        type="text"
                                        name="director_email"
                                        id="director_email"
                                        value={clientData.director_email}
                                        className="border w-full rounded-md p-2 mt-2 outline-none text-sm"
                                        onChange={handleClientChange}

                                    />

                                </div>

                            </div>
                            <div className="mb-4">
                                <label className="text-gray-500" htmlFor="emails">Emails:</label>
                                <div className="md:grid grid-cols-3 gap-3 flex-wrap">
                                    {newEmails.length > 0 ? (
                                        newEmails.map((email, index) => (
                                            <div key={index} className="flex gap-2 mt-3 md:mt-0">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    className="border rounded-md p-2  outline-none w-full"
                                                    onChange={(e) => handleEmailChange(index, e.target.value)} // Handle email change
                                                />
                                                {/* Delete button will show only for emails except the first */}
                                                {index > 0 && (
                                                    <button
                                                        className="bg-red-500 rounded-md p-2 text-white"
                                                        type="button"
                                                        onClick={() => deleteEmails(index)} // Delete email on click
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                                {/* Display error message for each email input */}
                                                {errors[`email${index}`] && (
                                                    <p className="text-red-500 text-sm whitespace-nowrap">
                                                        {errors[`email${index}`]}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p>No emails available</p>
                                    )}
                                </div>




                                <button className="bg-[#3e76a5] text-white rounded-3 p-2 mt-4 rounded-md" type="button" onClick={addNewEmailField}>ADD MORE</button>

                            </div>




                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="single_point_of_contact">Name of The Client SPOC:<span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="single_point_of_contact"
                                        id="single_point_of_contact"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.single_point_of_contact
                                        }
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["single_point_of_contact"] = el)}

                                    />
                                    {errors.single_point_of_contact
                                        && <p className="text-red-500">{errors.single_point_of_contact
                                        }</p>}
                                </div>

                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="gst_number">GSTIN <span className="text-red-600">*</span></label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        id="gst_number"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.gst_number}
                                        ref={(el) => (refs.current["gst_number"] = el)}

                                        onChange={handleClientChange}
                                    />
                                    {errors.gst_number && <p className="text-red-500">{errors.gst_number}</p>}
                                </div>
                            </div>

                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="tat_days">TAT: <span className="text-red-600">*</span></label>
                                    <input
                                        type="number"
                                        name="tat_days"
                                        id="tat_days"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.tat_days}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["tat_days"] = el)}

                                    />
                                    {errors.tat_days && <p className="text-red-500">{errors.tat_days}</p>}
                                </div>

                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="agreement_date">Date of Service Agreement:<span className="text-red-600">*</span></label>
                                    <input
                                        type="date"
                                        name="agreement_date"
                                        id="agreement_date"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.agreement_date ? new Date(clientData.agreement_date).toISOString().split('T')[0] : ''}
                                        onChange={handleClientChange}
                                        ref={(el) => (refs.current["agreement_date"] = el)}
                                    />

                                    {errors.agreement_date && <p className="text-red-500">{errors.agreement_date}</p>}
                                </div>
                            </div>

                            <div className="md:flex gap-5">
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="client_standard">Client Standard Procedure:</label>
                                    <textarea name="client_standard"
                                        id="client_standard"
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        value={clientData.client_standard}
                                        rows={1}

                                        onChange={handleClientChange}></textarea>
                                </div>
                                <div className="mb-4 md:w-6/12">
                                    <label className="text-gray-500" htmlFor="agreement_duration">Agreement Period</label>

                                    <select name="agreement_duration"
                                        className="border w-full rounded-md p-2 mt-2 outline-none" id="agreement_duration" onChange={handleClientChange} value={clientData.agreement_duration}>
                                        <option value="Unless terminated" selected>Unless terminated</option>
                                        <option value="1 year">1 year</option>
                                        <option value="2 year">2 year</option>
                                        <option value="3 year">3 year</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="text-gray-500" htmlFor="agr_upload">Agreement Upload:<span className="text-red-500">*</span></label>

                                <input
                                    ref={(el) => (refs.current["agr_upload"] = el)}
                                    type="file"
                                    name="agr_upload"
                                    id="agr_upload"
                                    className="border w-full rounded-md p-2 mt-2 outline-none"
                                    onChange={(e) => handleFileChange('agr_upload', e)}
                                    accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                />
                                {errors.agr_upload && <p className="text-red-500">{errors.agr_upload}</p>}


                                <p className="text-gray-500 text-sm mt-2">
                                    Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                </p>

                                <div className="border p-3 mt-3 rounded-md">
                                    {clientData.agreement ? (
                                        // Check if the file is an image
                                        clientData.agreement.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                            <img
                                                src={`${clientData.agreement}`}
                                                alt="Image"
                                                className="w-40- h-40"
                                            />
                                        ) : (
                                            // If it's a document (pdf, doc, etc.), show a button
                                            <a
                                                href={`${clientData.agreement}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                    View Document
                                                </button>
                                            </a>
                                        )
                                    ) : (
                                       ''
                                    )}

                                </div>

                            </div>

                            <div className="mb-4">
                                <label className="text-gray-500" htmlFor="industry_classification">Industry Classification<span className="text-red-600">*</span></label>
                                <input
                                    type="text"
                                    name="industry_classification"
                                    id="industry_classification"
                                    className="border w-full rounded-md p-2 mt-2 outline-none"
                                    onChange={handleClientChange}
                                    ref={(el) => (refs.current["industry_classification"] = el)}
                                    value={clientData.industry_classification}

                                />
                                {errors.industry_classification && <p className="text-red-500">{errors.industry_classification}</p>}

                            </div>


                            <div className="mb-4">
                                <label className="text-gray-500" htmlFor="custom_template">Required Custom Template:<span className="text-red-600">*</span></label>
                                <select
                                    name="custom_template"
                                    ref={(el) => (refs.current["custom_template"] = el)}
                                    id="custom_template"
                                    value={clientData.custom_template || ''}
                                    className="border w-full rounded-md p-2 mt-2 outline-none"
                                    onChange={handleClientChange}
                                >
                                    <option value="">Select Option</option>
                                    <option value="yes">yes</option>
                                    <option value="no">no</option>
                                </select>
                                {errors.custom_template && <p className="text-red-500">{errors.custom_template}</p>}

                                {clientData.custom_template === 'yes' && (
                                    <>
                                        <div className="mb-4 mt-3">
                                            <label htmlFor="custom_logo" className="text-gray-500">Upload Custom Logo :<span className="text-red-600">*</span></label>
                                            <input
                                                ref={(el) => (refs.current["custom_logo"] = el)}
                                                type="file"
                                                name="custom_logo"
                                                id="custom_logo"
                                                className="border w-full rounded-md p-2 mt-2 outline-none"
                                                onChange={(e) => handleFileChange('custom_logo', e)}
                                                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                                            />
                                            {errors.custom_logo && <p className="text-red-500">{errors.custom_logo}</p>}

                                            <p className="text-gray-500 text-sm mt-2">
                                                Only JPG, PNG, PDF, DOCX, and XLSX files are allowed. Max file size: 2MB.
                                            </p>
                                            <div className="border p-3 rounded-md mt-3"> {clientData.logo ? (
                                                clientData.logo.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                                                    <img
                                                        src={`${clientData.logo}`}
                                                        alt="Image"
                                                        className="w-40- h-40"
                                                    />
                                                ) : (
                                                    <a
                                                        href={`${clientData.logo}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <button type="button" className="px-4 py-2 bg-[#3e76a5] text-white rounded">
                                                            View Document
                                                        </button>
                                                    </a>
                                                )
                                            ) : (
                                                '----'
                                            )}</div>

                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="custom_address" className="text-gray-500">Custom Address</label>
                                            <textarea
                                                name="custom_address"
                                                id="custom_address"
                                                onChange={handleClientChange}
                                                value={clientData.custom_address}
                                                className="border w-full rounded-md p-2 mt-2 outline-none"
                                            ></textarea>

                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="text-gray-500" htmlFor="additional_login">Additional login Required</label>
                                <div className="flex items-center gap-10 mt-4">
                                    <div>
                                        <input
                                            type="radio"
                                            name="additional_login"
                                            value="1"
                                            checked={parseInt(clientData.additional_login, 10) === 1}
                                            onChange={handleClientChange}
                                            className="me-2"
                                        />Yes
                                    </div>
                                    <div>
                                        <input
                                            type="radio"
                                            name="additional_login"
                                            value="0"
                                            checked={parseInt(clientData.additional_login, 10) === 0}
                                            onChange={handleClientChange}
                                            className="me-2"
                                        />No
                                    </div>
                                </div>
                                {parseInt(clientData.additional_login, 10) === 1 && (
                                    <input
                                        type="text"
                                        name="username"
                                        id="username"
                                        placeholder="username2"
                                        value={clientData.username}
                                        className="border w-full rounded-md p-2 mt-2 outline-none"
                                        onChange={handleClientChange}
                                    />
                                )}
                            </div>

                            <div className="mb-4 flex gap-2 justify-start items-center">
                                {/* Log the current value of is_custom_bgv */}

                                <input
                                    type="checkbox"
                                    name="is_custom_bgv"
                                    id="is_custom_bgv"
                                    className="border rounded-md p-2 mt-0"
                                    onChange={(e) =>
                                        setClientData((prev) => ({
                                            ...prev,
                                            is_custom_bgv: e.target.checked ? '1' : '0',
                                        }))
                                    }
                                    checked={parseInt(clientData.is_custom_bgv, 10) === 1}
                                    ref={(el) => (refs.current['is_custom_bgv'] = el)}
                                />
                                <label className="text-gray-500" htmlFor="is_custom_bgv">Custom BGV</label>
                            </div>


                            <ServicesEditForm />
                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    className="bg-[#3e76a5] w-full text-white p-3 mt-5 rounded-md hover:bg-[#3e76a5]"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Update'}

                                </button>
                            </div>

                        </form>)}
                </div>

            </div>
        </>
    )
}
